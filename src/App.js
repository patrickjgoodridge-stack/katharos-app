import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Upload,
  FileText,
  MessageSquare,
  Loader2,
  Download,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Shield,
  AlertTriangle,
  CheckCircle,
  Users,
  Building2,
  Globe,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  UserCheck,
  Briefcase
} from 'lucide-react';
import mammoth from 'mammoth';

function App() {
  // Product selection state
  const [selectedProduct, setSelectedProduct] = useState(null);

  // NOIR states
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [cases, setCases] = useState([]);
  const [currentCase, setCurrentCase] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [editingCaseId, setEditingCaseId] = useState(null);
  const [currentPage, setCurrentPage] = useState('landing');

  // SCOUT states
  const [scoutSearchType, setScoutSearchType] = useState('individual');
  const [scoutSearchQuery, setScoutSearchQuery] = useState('');
  const [scoutLoading, setScoutLoading] = useState(false);
  const [scoutResults, setScoutResults] = useState(null);
  const [scoutHistory, setScoutHistory] = useState([]);
  const [scoutProjects, setScoutProjects] = useState([]);
  const [currentScoutProject, setCurrentScoutProject] = useState(null);
  const [showScoutProjectModal, setShowScoutProjectModal] = useState(false);
  const [newScoutProjectName, setNewScoutProjectName] = useState('');
  const [scoutFilters, setScoutFilters] = useState({
    riskLevel: 'all',
    sanctionStatus: 'all',
    pepStatus: 'all'
  });
  const [expandedHistoryItem, setExpandedHistoryItem] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // File handling
  const handleFileUpload = async (uploadedFiles) => {
    const newFiles = [];

    for (const file of uploadedFiles) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          newFiles.push({
            id: Date.now() + Math.random(),
            name: file.name,
            content: result.value,
            type: 'docx',
            size: file.size
          });
        } catch (error) {
          console.error('Error reading DOCX file:', error);
          alert(`Error reading ${file.name}: ${error.message}`);
        }
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        newFiles.push({
          id: Date.now() + Math.random(),
          name: file.name,
          content: text,
          type: 'txt',
          size: file.size
        });
      }
    }

    setFiles(prev => [...prev, ...newFiles]);

    if (currentCase) {
      setCases(prev => prev.map(c =>
        c.id === currentCase.id
          ? { ...c, files: [...c.files, ...newFiles] }
          : c
      ));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));

    if (currentCase) {
      setCases(prev => prev.map(c =>
        c.id === currentCase.id
          ? { ...c, files: c.files.filter(f => f.id !== fileId) }
          : c
      ));
    }
  };

  // NOIR Analysis
  const analyzeEvidence = async () => {
    if (files.length === 0) {
      alert('Please upload at least one document to analyze.');
      return;
    }

    setLoading(true);

    const combinedContent = files.map(f =>
      `Document: ${f.name}\n\n${f.content}`
    ).join('\n\n---\n\n');

    const analysisPrompt = `You are NOIR, an advanced investigative AI assistant. Analyze the following evidence and provide:

1. KEY ENTITIES: Extract all people, organizations, locations, and dates
2. TIMELINE: Create a chronological timeline of events
3. CONNECTIONS: Identify relationships between entities
4. RISK ASSESSMENT: Evaluate potential legal, financial, or compliance risks
5. INVESTIGATIVE LEADS: Suggest areas for further investigation
6. SUMMARY: Provide a concise executive summary

Evidence:
${combinedContent}

Provide a comprehensive analysis in a structured format.`;

    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new Error('API key not configured. Please set REACT_APP_ANTHROPIC_API_KEY in your environment.');
      }

      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: analysisPrompt
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const analysisText = data.content[0].text;

      setAnalysisResults(analysisText);

      if (currentCase) {
        setCases(prev => prev.map(c =>
          c.id === currentCase.id
            ? { ...c, analysis: analysisText, lastUpdated: new Date().toISOString() }
            : c
        ));
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Chat functionality
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new Error('API key not configured');
      }

      const contextMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const systemContext = analysisResults
        ? `You are NOIR, an investigative AI assistant. You have access to the following analysis:\n\n${analysisResults}\n\nUse this context to answer questions about the case.`
        : 'You are NOIR, an investigative AI assistant. Help the user with their investigation.';

      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: systemContext,
          messages: [...contextMessages, userMessage]
        })
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (currentCase) {
        setCases(prev => prev.map(c =>
          c.id === currentCase.id
            ? { ...c, messages: [...c.messages, userMessage, assistantMessage] }
            : c
        ));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Case management
  const createCase = () => {
    if (!newCaseName.trim()) return;

    const newCase = {
      id: Date.now(),
      name: newCaseName,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      files: [],
      messages: [],
      analysis: null
    };

    setCases(prev => [...prev, newCase]);
    setNewCaseName('');
    setShowCaseModal(false);
    loadCase(newCase);
  };

  const loadCase = (caseData) => {
    setCurrentCase(caseData);
    setFiles(caseData.files || []);
    setMessages(caseData.messages || []);
    setAnalysisResults(caseData.analysis || null);
    setCurrentPage('noir');
  };

  const deleteCase = (caseId) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      setCases(prev => prev.filter(c => c.id !== caseId));
      if (currentCase?.id === caseId) {
        setCurrentCase(null);
        setFiles([]);
        setMessages([]);
        setAnalysisResults(null);
      }
    }
  };

  const updateCaseName = (caseId, newName) => {
    setCases(prev => prev.map(c =>
      c.id === caseId ? { ...c, name: newName, lastUpdated: new Date().toISOString() } : c
    ));
    if (currentCase?.id === caseId) {
      setCurrentCase(prev => ({ ...prev, name: newName }));
    }
    setEditingCaseId(null);
  };

  // Report generation
  const generateReport = () => {
    if (!analysisResults) {
      alert('Please run an analysis first');
      return;
    }

    const reportContent = `
MARLOWE NOIR - INVESTIGATIVE REPORT
${currentCase ? `Case: ${currentCase.name}` : 'Ad-hoc Analysis'}
Generated: ${new Date().toLocaleString()}

========================================

EVIDENCE FILES:
${files.map(f => `- ${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join('\n')}

========================================

ANALYSIS:

${analysisResults}

========================================

CHAT HISTORY:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

========================================
End of Report
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noir-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // SCOUT KYC Functions
  const performKYCScreening = async () => {
    if (!scoutSearchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    setScoutLoading(true);

    const screeningPrompt = `You are SCOUT, an advanced KYC and sanctions screening AI. Perform a comprehensive screening for the following ${scoutSearchType}:

Query: ${scoutSearchQuery}

Provide a detailed analysis including:

1. IDENTITY VERIFICATION
   - Name variations and aliases
   - Date of birth / Incorporation date
   - Nationality / Jurisdiction
   - Known addresses

2. SANCTIONS SCREENING
   - Check against OFAC SDN list
   - EU sanctions list
   - UN sanctions list
   - Country-specific sanctions
   - Match confidence level

3. PEP (Politically Exposed Person) SCREENING
   - Current or former political positions
   - Government roles
   - Family members with political connections
   - Risk level assessment

4. ADVERSE MEDIA
   - Criminal proceedings
   - Regulatory actions
   - Negative news
   - Reputation risks

5. CORPORATE STRUCTURE (if entity)
   - Beneficial ownership
   - Related entities
   - Subsidiary information
   - Control structure

6. RISK ASSESSMENT
   - Overall risk score (Low/Medium/High/Critical)
   - Specific risk factors
   - Recommended actions
   - Due diligence level required

7. COMPLIANCE RECOMMENDATION
   - Proceed / Enhanced Due Diligence / Reject
   - Monitoring requirements
   - Documentation needed

Provide a comprehensive, structured response as if conducting a real KYC screening.`;

    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new Error('API key not configured');
      }

      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: screeningPrompt
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Screening request failed');
      }

      const data = await response.json();
      const screeningText = data.content[0].text;

      const riskLevel = screeningText.toLowerCase().includes('critical') ? 'critical' :
                        screeningText.toLowerCase().includes('high') ? 'high' :
                        screeningText.toLowerCase().includes('medium') ? 'medium' : 'low';

      const hasSanctions = screeningText.toLowerCase().includes('sanction') &&
                          !screeningText.toLowerCase().includes('no sanctions');

      const isPEP = screeningText.toLowerCase().includes('politically exposed') ||
                   screeningText.toLowerCase().includes('pep: yes');

      const result = {
        id: Date.now(),
        query: scoutSearchQuery,
        type: scoutSearchType,
        timestamp: new Date().toISOString(),
        riskLevel,
        hasSanctions,
        isPEP,
        fullReport: screeningText,
        project: currentScoutProject?.name || 'Default'
      };

      setScoutResults(result);
      setScoutHistory(prev => [result, ...prev]);

      if (currentScoutProject) {
        setScoutProjects(prev => prev.map(p =>
          p.id === currentScoutProject.id
            ? { ...p, screenings: [result, ...p.screenings], lastUpdated: new Date().toISOString() }
            : p
        ));
      }
    } catch (error) {
      console.error('Screening error:', error);
      alert(`Screening failed: ${error.message}`);
    } finally {
      setScoutLoading(false);
    }
  };

  // SCOUT Project Management
  const createScoutProject = () => {
    if (!newScoutProjectName.trim()) return;

    const newProject = {
      id: Date.now(),
      name: newScoutProjectName,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      screenings: []
    };

    setScoutProjects(prev => [...prev, newProject]);
    setNewScoutProjectName('');
    setShowScoutProjectModal(false);
    setCurrentScoutProject(newProject);
  };

  const deleteScoutProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setScoutProjects(prev => prev.filter(p => p.id !== projectId));
      if (currentScoutProject?.id === projectId) {
        setCurrentScoutProject(null);
      }
    }
  };

  const generateScoutReport = (screening) => {
    const reportContent = `
MARLOWE SCOUT - KYC SCREENING REPORT
${currentScoutProject ? `Project: ${currentScoutProject.name}` : 'Ad-hoc Screening'}
Generated: ${new Date().toLocaleString()}

========================================

SCREENING DETAILS:
Type: ${screening.type.toUpperCase()}
Query: ${screening.query}
Date: ${new Date(screening.timestamp).toLocaleString()}
Risk Level: ${screening.riskLevel.toUpperCase()}
Sanctions Found: ${screening.hasSanctions ? 'YES' : 'NO'}
PEP Status: ${screening.isPEP ? 'YES' : 'NO'}

========================================

FULL SCREENING REPORT:

${screening.fullReport}

========================================
End of Report
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scout-screening-${screening.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filterScoutHistory = (item) => {
    if (scoutFilters.riskLevel !== 'all' && item.riskLevel !== scoutFilters.riskLevel) {
      return false;
    }
    if (scoutFilters.sanctionStatus === 'yes' && !item.hasSanctions) {
      return false;
    }
    if (scoutFilters.sanctionStatus === 'no' && item.hasSanctions) {
      return false;
    }
    if (scoutFilters.pepStatus === 'yes' && !item.isPEP) {
      return false;
    }
    if (scoutFilters.pepStatus === 'no' && item.isPEP) {
      return false;
    }
    return true;
  };

  // UI Rendering
  const renderLandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            MARLOWE
          </h1>
          <p className="text-2xl text-blue-200 mb-2">
            Investigative AI Platform
          </p>
          <p className="text-lg text-blue-300">
            Powered by Claude AI - Advanced Analytics for Compliance & Investigation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* NOIR Card */}
          <div
            onClick={() => setCurrentPage('noir')}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all cursor-pointer transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Search className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              NOIR
            </h2>
            <p className="text-xl text-blue-200 mb-6 text-center">
              Investigative Analysis
            </p>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-400" />
                <span>Advanced evidence analysis with entity extraction</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-400" />
                <span>Automated timeline generation and connection mapping</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-400" />
                <span>Case management with document upload (.txt, .docx)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-400" />
                <span>Interactive AI chat for investigative insights</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-400" />
                <span>Risk assessment and investigative lead generation</span>
              </li>
            </ul>
            <button className="w-full mt-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all">
              Launch NOIR
            </button>
          </div>

          {/* SCOUT Card */}
          <div
            onClick={() => setCurrentPage('scout')}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all cursor-pointer transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              SCOUT
            </h2>
            <p className="text-xl text-blue-200 mb-6 text-center">
              KYC & Sanctions Screening
            </p>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-400" />
                <span>Comprehensive sanctions screening (OFAC, EU, UN)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-400" />
                <span>PEP (Politically Exposed Person) identification</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-400" />
                <span>Adverse media monitoring and risk scoring</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-400" />
                <span>Individual and entity screening capabilities</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-400" />
                <span>Project-based screening organization and reporting</span>
              </li>
            </ul>
            <button className="w-full mt-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all">
              Launch SCOUT
            </button>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-blue-200 text-sm">
            Enterprise-grade investigative tools powered by Claude AI
          </p>
          <p className="text-blue-300 text-xs mt-2">
            Configure your REACT_APP_ANTHROPIC_API_KEY to enable full functionality
          </p>
        </div>
      </div>
    </div>
  );

  const renderNoirPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage('landing')}
                className="text-white hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Search className="w-6 h-6 text-purple-400" />
                MARLOWE NOIR
              </h1>
              {currentCase && (
                <span className="text-purple-300 text-sm">
                  | {currentCase.name}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCaseModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Case
              </button>
              {analysisResults && (
                <button
                  onClick={generateReport}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Cases */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <h2 className="text-lg font-semibold text-white mb-4">Cases</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cases.map(caseItem => (
                  <div
                    key={caseItem.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      currentCase?.id === caseItem.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    {editingCaseId === caseItem.id ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          defaultValue={caseItem.name}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateCaseName(caseItem.id, e.target.value);
                            }
                          }}
                          className="flex-1 bg-white/20 text-white px-2 py-1 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => updateCaseName(caseItem.id, document.querySelector(`input[defaultValue="${caseItem.name}"]`).value)}
                          className="text-green-300 hover:text-green-100"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          onClick={() => loadCase(caseItem)}
                          className="flex-1"
                        >
                          <div className="font-medium">{caseItem.name}</div>
                          <div className="text-xs opacity-75 mt-1">
                            {new Date(caseItem.created).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCaseId(caseItem.id);
                            }}
                            className="text-blue-300 hover:text-blue-100"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCase(caseItem.id);
                            }}
                            className="text-red-300 hover:text-red-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {cases.length === 0 && (
                  <p className="text-blue-300 text-sm text-center py-4">
                    No cases yet. Create one to get started.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* File Upload Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                Evidence Upload
              </h2>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-purple-400/50 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <p className="text-white mb-2">Drag and drop files here, or click to select</p>
                <p className="text-blue-300 text-sm">Supported: .txt, .docx</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.docx"
                onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between bg-white/5 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="text-white font-medium">{file.name}</div>
                          <div className="text-blue-300 text-xs">
                            {(file.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={analyzeEvidence}
                disabled={files.length === 0 || loading}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Analyze Evidence
                  </>
                )}
              </button>
            </div>

            {/* Analysis Results */}
            {analysisResults && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
                <div className="bg-black/30 p-4 rounded-lg text-blue-100 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {analysisResults}
                </div>
              </div>
            )}

            {/* Chat Interface */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Investigative Chat
              </h2>

              <div className="bg-black/30 rounded-lg p-4 h-96 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <p className="text-blue-300 text-center py-8">
                    Start a conversation with NOIR to explore your case...
                  </p>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`mb-4 ${
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-block max-w-3/4 p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-blue-100'
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1">
                          {msg.role === 'user' ? 'You' : 'NOIR'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask NOIR about your investigation..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-300"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Case</h3>
            <input
              type="text"
              value={newCaseName}
              onChange={(e) => setNewCaseName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createCase()}
              placeholder="Enter case name..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-300 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={createCase}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCaseModal(false);
                  setNewCaseName('');
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderScoutPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage('landing')}
                className="text-white hover:text-blue-300 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-400" />
                MARLOWE SCOUT
              </h1>
              {currentScoutProject && (
                <span className="text-blue-300 text-sm">
                  | {currentScoutProject.name}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowScoutProjectModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Projects */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <h2 className="text-lg font-semibold text-white mb-4">Projects</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div
                  onClick={() => setCurrentScoutProject(null)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    !currentScoutProject
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium">All Screenings</div>
                  <div className="text-xs opacity-75 mt-1">
                    {scoutHistory.length} total
                  </div>
                </div>
                {scoutProjects.map(project => (
                  <div
                    key={project.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      currentScoutProject?.id === project.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <div onClick={() => setCurrentScoutProject(project)}>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {project.screenings.length} screenings
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScoutProject(project.id);
                      }}
                      className="text-red-300 hover:text-red-100 mt-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Screening Interface */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">KYC Screening</h2>

              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setScoutSearchType('individual')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    scoutSearchType === 'individual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  Individual
                </button>
                <button
                  onClick={() => setScoutSearchType('entity')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    scoutSearchType === 'entity'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  Entity
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={scoutSearchQuery}
                  onChange={(e) => setScoutSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && performKYCScreening()}
                  placeholder={`Enter ${scoutSearchType} name...`}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300"
                />
                <button
                  onClick={performKYCScreening}
                  disabled={!scoutSearchQuery.trim() || scoutLoading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {scoutLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Screening...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Screen
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Current Screening Results */}
            {scoutResults && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Screening Results</h2>
                  <button
                    onClick={() => generateScoutReport(scoutResults)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-black/30 p-4 rounded-lg">
                    <div className="text-blue-300 text-sm mb-1">Risk Level</div>
                    <div className={`text-lg font-bold ${
                      scoutResults.riskLevel === 'critical' ? 'text-red-400' :
                      scoutResults.riskLevel === 'high' ? 'text-orange-400' :
                      scoutResults.riskLevel === 'medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {scoutResults.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg">
                    <div className="text-blue-300 text-sm mb-1">Sanctions</div>
                    <div className={`text-lg font-bold ${
                      scoutResults.hasSanctions ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {scoutResults.hasSanctions ? 'FOUND' : 'CLEAR'}
                    </div>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg">
                    <div className="text-blue-300 text-sm mb-1">PEP Status</div>
                    <div className={`text-lg font-bold ${
                      scoutResults.isPEP ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {scoutResults.isPEP ? 'YES' : 'NO'}
                    </div>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg">
                    <div className="text-blue-300 text-sm mb-1">Type</div>
                    <div className="text-lg font-bold text-white">
                      {scoutResults.type.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 p-4 rounded-lg text-blue-100 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {scoutResults.fullReport}
                </div>
              </div>
            )}

            {/* Screening History */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Screening History</h2>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-300" />
                  <select
                    value={scoutFilters.riskLevel}
                    onChange={(e) => setScoutFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <select
                    value={scoutFilters.sanctionStatus}
                    onChange={(e) => setScoutFilters(prev => ({ ...prev, sanctionStatus: e.target.value }))}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm"
                  >
                    <option value="all">All Sanctions</option>
                    <option value="yes">Sanctions Found</option>
                    <option value="no">No Sanctions</option>
                  </select>
                  <select
                    value={scoutFilters.pepStatus}
                    onChange={(e) => setScoutFilters(prev => ({ ...prev, pepStatus: e.target.value }))}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm"
                  >
                    <option value="all">All PEP Status</option>
                    <option value="yes">PEP</option>
                    <option value="no">Non-PEP</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scoutHistory.filter(filterScoutHistory).map(item => (
                  <div key={item.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-white font-semibold">{item.query}</div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            item.riskLevel === 'critical' ? 'bg-red-500 text-white' :
                            item.riskLevel === 'high' ? 'bg-orange-500 text-white' :
                            item.riskLevel === 'medium' ? 'bg-yellow-500 text-black' :
                            'bg-green-500 text-white'
                          }`}>
                            {item.riskLevel.toUpperCase()}
                          </span>
                          {item.hasSanctions && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-red-600 text-white flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              SANCTIONS
                            </span>
                          )}
                          {item.isPEP && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-orange-600 text-white flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              PEP
                            </span>
                          )}
                        </div>
                        <div className="text-blue-300 text-sm flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            {item.type === 'individual' ? <Users className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                            {item.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {item.project}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExpandedHistoryItem(expandedHistoryItem === item.id ? null : item.id)}
                          className="text-blue-300 hover:text-blue-100"
                        >
                          {expandedHistoryItem === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => generateScoutReport(item)}
                          className="text-green-300 hover:text-green-100"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {expandedHistoryItem === item.id && (
                      <div className="mt-4 bg-black/30 p-4 rounded-lg text-blue-100 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {item.fullReport}
                      </div>
                    )}
                  </div>
                ))}
                {scoutHistory.filter(filterScoutHistory).length === 0 && (
                  <p className="text-blue-300 text-center py-8">
                    No screening history yet. Perform a screening to get started.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Modal */}
      {showScoutProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Project</h3>
            <input
              type="text"
              value={newScoutProjectName}
              onChange={(e) => setNewScoutProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createScoutProject()}
              placeholder="Enter project name..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-300 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={createScoutProject}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowScoutProjectModal(false);
                  setNewScoutProjectName('');
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Main Render
  return (
    <>
      {currentPage === 'landing' && renderLandingPage()}
      {currentPage === 'noir' && renderNoirPage()}
      {currentPage === 'scout' && renderScoutPage()}
    </>
  );
}

export default App;
