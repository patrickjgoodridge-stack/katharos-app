import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, Clock, Users, AlertTriangle, ChevronRight, ChevronDown, Search, Zap, Eye, Link2, X, Loader2, Shield, Network, FileWarning, CheckCircle2, XCircle, HelpCircle, BookOpen, Target, Lightbulb, ArrowRight, MessageCircle, Send, Minimize2, Folder, Plus, Trash2, ArrowLeft, FolderOpen, Calendar, Pencil, Check, UserSearch, Building2, Globe, Newspaper, ShieldCheck, ShieldAlert, Home, GitBranch, Share2, Database, Scale, Flag, Download, FolderPlus, History, Tag, Moon, Sun, Briefcase } from 'lucide-react';
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import ForceGraph2D from 'react-force-graph-2d';

// Configure PDF.js worker - use local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// API base URL - uses local server in development, relative paths in production
const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';

// Main Marlowe Component
export default function Marlowe() {
 const [currentPage, setCurrentPage] = useState('noirLanding'); // 'noirLanding', 'newCase', 'existingCases', 'activeCase'
 const [cases, setCases] = useState([]);
 const [activeCase, setActiveCase] = useState(null);
 const [files, setFiles] = useState([]);
 const [analysis, setAnalysis] = useState(null);
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [activeTab, setActiveTab] = useState('overview');
 const [selectedEvent, setSelectedEvent] = useState(null);
 const [selectedEntity, setSelectedEntity] = useState(null);
 const [entityImages, setEntityImages] = useState({}); // eslint-disable-line no-unused-vars
 const [dragActive, setDragActive] = useState(false);
 const [expandedHypotheses, setExpandedHypotheses] = useState({});
 const [expandedInvestigations, setExpandedInvestigations] = useState({});
 const [chatOpen, setChatOpen] = useState(false);
 const [chatMessages, setChatMessages] = useState([]);
 const [chatInput, setChatInput] = useState('');
 const [isChatLoading, setIsChatLoading] = useState(false);
 const [caseName, setCaseName] = useState('');
 const [caseDescription, setCaseDescription] = useState('');
 const [placeholderIndex, setPlaceholderIndex] = useState(0);
 const [editingCaseId, setEditingCaseId] = useState(null);
 const [editingCaseName, setEditingCaseName] = useState('');
 const [isEditingCaseName, setIsEditingCaseName] = useState(false);
 const [tempCaseName, setTempCaseName] = useState('');
 
 const [analysisError, setAnalysisError] = useState(null); // eslint-disable-line no-unused-vars

 // Background analysis state - allows navigation while processing
 const [backgroundAnalysis, setBackgroundAnalysis] = useState({
   isRunning: false,
   isComplete: false,
   caseId: null,
   caseName: '',
   currentStep: '',
   stepNumber: 0,
   totalSteps: 10,
   progress: 0,
   pendingAnalysis: null // Stores completed analysis until user clicks to view
 });

 // Investigation mode state
 const [investigationMode, setInvestigationMode] = useState('cipher'); // 'cipher' or 'scout'
 const [showModeDropdown, setShowModeDropdown] = useState(false);

 // Scout state
 const [kycPage, setKycPage] = useState('landing'); // 'landing', 'newSearch', 'history', 'projects', 'results'
 const [kycQuery, setKycQuery] = useState('');
 const [kycType, setKycType] = useState('individual'); // 'individual' or 'entity'
 const [kycResults, setKycResults] = useState(null);
 const [isScreening, setIsScreening] = useState(false);
 const [screeningStep, setScreeningStep] = useState('');
 const [screeningProgress, setScreeningProgress] = useState(0);
 const [kycHistory, setKycHistory] = useState([]);
 const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
 
 // Individual screening fields
 const [kycClientRef, setKycClientRef] = useState('');
 const [kycYearOfBirth, setKycYearOfBirth] = useState('');
 const [kycCountry, setKycCountry] = useState('');
 
 // Projects
 const [kycProjects, setKycProjects] = useState([]);
 const [selectedProject, setSelectedProject] = useState(null);
 const [newProjectName, setNewProjectName] = useState('');
 const [assigningToProject, setAssigningToProject] = useState(null); // screening ID being assigned
 const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
 const [isGeneratingCaseReport, setIsGeneratingCaseReport] = useState(false);
 
 // KYC Chat state
 const [kycChatOpen, setKycChatOpen] = useState(false);
 const [kycChatMessages, setKycChatMessages] = useState([]);
 const [kycChatInput, setKycChatInput] = useState('');

 // Upload dropdown state
 const [showUploadDropdown, setShowUploadDropdown] = useState(false);
 const [isKycChatLoading, setIsKycChatLoading] = useState(false);
 
 const kycChatEndRef = useRef(null);
 
 const chatEndRef = useRef(null);
 const fileInputRef = useRef(null);
 const editInputRef = useRef(null);
 const modeDropdownRef = useRef(null);
 const uploadDropdownRef = useRef(null);

 // Landing page state
 const [showLandingCards, setShowLandingCards] = useState(false); // eslint-disable-line no-unused-vars
 const [hoveredCard, setHoveredCard] = useState(null); // eslint-disable-line no-unused-vars
 const [showLandingContent, setShowLandingContent] = useState(false); // eslint-disable-line no-unused-vars
 const [hasVisitedLanding, setHasVisitedLanding] = useState(false);
 const [marloweAnimationPhase, setMarloweAnimationPhase] = useState('large'); // eslint-disable-line no-unused-vars
 const [darkMode, setDarkMode] = useState(false);
 const [hasScrolled, setHasScrolled] = useState(false);

 // Rotating placeholder examples - different for each mode
 const cipherPlaceholderExamples = [
 "Evaluate possible signs of fraud in these quarterly financials...",
 "What are the money laundering risks of the entities mentioned in this email chain...",
 "Analyze these cap tables for possible sanctions exposure...",
 "Identify potential red flags in this employee expense report...",
 "Describe any irregularities in these inventory records suggesting potential theft or mismanagement...",
 "What anomalies in this payroll data could indicate ghost employees...",
 "What warning signs indicate this insurance claim might be fraudulent..."
 ];

 const scoutPlaceholderExamples = [
 "Screen an individual (Try \"Oleg Deripaska\" or \"Fetullah Gulen\")",
 "Check an entity (Try \"EN+ Group\" or \"COSCO Shipping\")"
 ];

 const placeholderExamples = investigationMode === 'scout' ? scoutPlaceholderExamples : cipherPlaceholderExamples;

 // Reset placeholder index when mode changes to avoid out-of-bounds
 useEffect(() => {
 setPlaceholderIndex(0);
 }, [investigationMode]);

 // Rotate placeholder with fade timing - synchronized with CSS animation
 useEffect(() => {
 // Start interval immediately to sync with CSS animation
 const interval = setInterval(() => {
 setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
 }, 7000); // Change every 7 seconds to match CSS animation duration
 return () => clearInterval(interval);
 }, [placeholderExamples.length]);

 // Landing page fade-in animation
 useEffect(() => {
 if (currentPage === 'noirLanding') {
 if (!hasVisitedLanding) {
 // First visit - fade in after delay
 setHasVisitedLanding(true);
 const timer = setTimeout(() => {
 setShowLandingContent(true);
 }, 500);
 return () => clearTimeout(timer);
 } else {
 // Subsequent visits - show immediately
 setShowLandingContent(true);
 }
 }
 }, [currentPage, hasVisitedLanding]);

 // Hide scroll indicator once user has scrolled
 useEffect(() => {
 const handleScroll = () => {
 if (window.scrollY > 100) {
 setHasScrolled(true);
 }
 };
 window.addEventListener('scroll', handleScroll);
 return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 // Reset scroll indicator when returning to landing page
 useEffect(() => {
 if (currentPage === 'noirLanding') {
 setHasScrolled(false);
 }
 }, [currentPage]);

 // Close mode dropdown when clicking outside
 useEffect(() => {
 const handleClickOutside = (event) => {
 if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target)) {
 setShowModeDropdown(false);
 }
 if (uploadDropdownRef.current && !uploadDropdownRef.current.contains(event.target)) {
 setShowUploadDropdown(false);
 }
 };

 if (showModeDropdown || showUploadDropdown) {
 document.addEventListener('mousedown', handleClickOutside);
 return () => {
 document.removeEventListener('mousedown', handleClickOutside);
 };
 }
 }, [showModeDropdown, showUploadDropdown]);

 // Save case after analysis completes
 const saveCase = (analysisData) => {
 const newCase = {
 id: Math.random().toString(36).substr(2, 9),
 name: caseName || `Case ${cases.length + 1}`,
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 files: files,
 analysis: analysisData,
 chatHistory: [],
 riskLevel: analysisData?.executiveSummary?.riskLevel || 'UNKNOWN'
 };
 setCases(prev => [newCase, ...prev]);
 setActiveCase(newCase);
 setCurrentPage('activeCase');

 // Save to reference database for AI learning (HIGH or CRITICAL cases only)
 if (analysisData?.executiveSummary?.riskLevel === 'HIGH' ||
 analysisData?.executiveSummary?.riskLevel === 'CRITICAL') {
 saveToReferenceDatabase(newCase);
 }
 };

 // Save high-quality analyses to reference database
 const saveToReferenceDatabase = async (caseData) => {
 try {
 // Create a sanitized reference entry (remove file contents for size)
 const referenceEntry = {
 id: caseData.id,
 name: caseData.name,
 createdAt: caseData.createdAt,
 riskLevel: caseData.riskLevel,
 fileTypes: caseData.files.map(f => ({ name: f.name, type: f.type })),
 analysis: {
 executiveSummary: caseData.analysis.executiveSummary,
 entities: caseData.analysis.entities?.slice(0, 10), // First 10 entities
 relationships: caseData.analysis.relationships?.slice(0, 15), // First 15 relationships
 timeline: caseData.analysis.timeline?.slice(0, 20), // First 20 events
 typologies: caseData.analysis.typologies,
 hypotheses: caseData.analysis.hypotheses,
 patterns: caseData.analysis.patterns,
 redFlags: caseData.analysis.redFlags
 }
 };

 // In a real app, this would POST to backend
 // For now, just log it (could save to localStorage)
 console.log('📚 Saving to reference database:', referenceEntry);

 // Save to localStorage as reference examples
 const existingReferences = JSON.parse(localStorage.getItem('marlowe_references') || '[]');
 existingReferences.push(referenceEntry);

 // Keep only last 50 reference cases
 const recentReferences = existingReferences.slice(-50);
 localStorage.setItem('marlowe_references', JSON.stringify(recentReferences));

 console.log(`✅ Reference database now contains ${recentReferences.length} cases`);
 } catch (error) {
 console.error('Failed to save to reference database:', error);
 }
 };

 // Load an existing case
 const loadCase = (caseData) => {
 setActiveCase(caseData);
 setFiles(caseData.files);
 setAnalysis(caseData.analysis);
 setChatMessages(caseData.chatHistory || []);
 setCaseName(caseData.name);
 setCurrentPage('activeCase');
 };

 // Start a new case
 const startNewCase = () => {
 setFiles([]);
 setAnalysis(null);
 setAnalysisError(null);
 setChatMessages([]);
 setCaseName('');
 setCaseDescription('');
 setActiveCase(null);
 setActiveTab('overview');
 setSelectedEvent(null);
 setSelectedEntity(null);
 setChatOpen(false);
 setCurrentPage('newCase');
 };

 // View completed analysis results
 const viewAnalysisResults = () => {
   if (backgroundAnalysis.pendingAnalysis) {
     setAnalysis(backgroundAnalysis.pendingAnalysis);
     setActiveTab('overview');
     // Reset the background analysis state
     setBackgroundAnalysis({
       isRunning: false,
       isComplete: false,
       caseId: null,
       caseName: '',
       currentStep: '',
       stepNumber: 0,
       totalSteps: 10,
       progress: 0,
       pendingAnalysis: null
     });
   }
 };

 // Go back to Noir landing
 const goToLanding = () => {
 // Save chat history if we have an active case
 if (activeCase && chatMessages.length > 0) {
 setCases(prev => prev.map(c =>
 c.id === activeCase.id
 ? { ...c, chatHistory: chatMessages, updatedAt: new Date().toISOString() }
 : c
 ));
 }
 // Go to landing page with cards showing (not the initial state)
 setShowLandingCards(true);
 setHoveredCard(null);
 setMarloweAnimationPhase('small');
 setCurrentPage('noirLanding');
 };

 // Go back to product selection
 const goToProductSelect = () => { // eslint-disable-line no-unused-vars
 if (activeCase && chatMessages.length > 0) {
 setCases(prev => prev.map(c => 
 c.id === activeCase.id 
 ? { ...c, chatHistory: chatMessages, updatedAt: new Date().toISOString() }
 : c
 ));
 }
 setCurrentPage('noirLanding');
 };

 // Delete a case
 const deleteCase = (caseId, e) => {
 e.stopPropagation();
 setCases(prev => prev.filter(c => c.id !== caseId));
 };

 // Start editing a case name
 const startEditingCase = (caseItem, e) => {
 e.stopPropagation();
 setEditingCaseId(caseItem.id);
 setEditingCaseName(caseItem.name);
 setTimeout(() => editInputRef.current?.focus(), 0);
 };

 // Save edited case name
 const saveEditedCaseName = (e) => {
 e?.stopPropagation();
 if (editingCaseName.trim()) {
 setCases(prev => prev.map(c => 
 c.id === editingCaseId 
 ? { ...c, name: editingCaseName.trim(), updatedAt: new Date().toISOString() }
 : c
 ));
 // Also update active case if it's the one being edited
 if (activeCase?.id === editingCaseId) {
 setActiveCase(prev => ({ ...prev, name: editingCaseName.trim() }));
 setCaseName(editingCaseName.trim());
 }
 }
 setEditingCaseId(null);
 setEditingCaseName('');
 };

 // Handle edit input key press
 const handleEditKeyPress = (e) => {
 if (e.key === 'Enter') {
 saveEditedCaseName(e);
 } else if (e.key === 'Escape') {
 setEditingCaseId(null);
 setEditingCaseName('');
 }
 };

 // Scout function
 const runKycScreening = async () => {
 if (!kycQuery.trim()) return;

 setIsScreening(true);
 setKycResults(null);
 setScreeningStep('Initializing screening...');
 setScreeningProgress(5);

 try {
 // Step 1: Get REAL sanctions screening data from backend
 setScreeningStep('Step 1/5: Querying global sanctions databases...');
 setScreeningProgress(15);
 const sanctionsResponse = await fetch(`${API_BASE}/api/screen-sanctions`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: kycQuery,
 type: kycType === 'individual' ? 'INDIVIDUAL' : 'ENTITY'
 })
 });

 const sanctionsData = await sanctionsResponse.json();
 setScreeningProgress(30);

 // Step 2: Get ownership network (bidirectional)
 setScreeningStep('Step 2/5: Analyzing beneficial ownership structure...');
 setScreeningProgress(35);
 const networkResponse = await fetch(`${API_BASE}/api/ownership-network`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: kycQuery,
 type: kycType === 'individual' ? 'INDIVIDUAL' : 'ENTITY'
 })
 });
 const ownershipNetwork = await networkResponse.json();
 setScreeningProgress(50);

 // Also get traditional ownership analysis for entities
 let ownershipData = null;
 if (kycType === 'entity') {
 ownershipData = ownershipNetwork; // Network already contains ownership analysis for entities
 }

 // Step 3: Build context with REAL data for Claude to analyze
 setScreeningStep('Step 3/5: Building compliance context...');
 setScreeningProgress(55);
 const realDataContext = `
REAL SANCTIONS SCREENING RESULTS:
${sanctionsData.status === 'MATCH' ? `
✓ DIRECT MATCH FOUND
- Matched Name: ${sanctionsData.match.name}
- Listing Date: ${sanctionsData.match.listingDate}
- Lists: ${sanctionsData.match.lists.join(', ')}
- Programs: ${sanctionsData.match.programs.join(', ')}
- Details: ${sanctionsData.match.details}
${sanctionsData.match.entities ? `- Associated Entities: ${sanctionsData.match.entities.join(', ')}` : ''}
${sanctionsData.match.ownership ? `- Known Ownership: ${JSON.stringify(sanctionsData.match.ownership, null, 2)}` : ''}
` : sanctionsData.status === 'POTENTIAL_MATCH' ? `
⚠ POTENTIAL MATCHES FOUND:
${sanctionsData.potentialMatches.map(m => `- ${m.name} (${m.lists.join(', ')})`).join('\n')}
` : '✓ NO SANCTIONS MATCH FOUND'}

${ownershipData ? `
REAL BENEFICIAL OWNERSHIP ANALYSIS:
- OFAC 50% Rule Triggered: ${ownershipData.fiftyPercentRuleTriggered ? 'YES - ENTITY IS BLOCKED' : 'NO'}
- Aggregate Blocked Ownership: ${ownershipData.aggregateBlockedOwnership}%
- Risk Level: ${ownershipData.riskLevel}
- Summary: ${ownershipData.summary}

Beneficial Owners:
${ownershipData.beneficialOwners.map(o =>
 `- ${o.name}: ${o.ownershipPercent}% (${o.ownershipType}) - ${o.sanctionStatus}${o.sanctionDetails ? ` [${o.sanctionDetails.lists.join(', ')}]` : ''}`
).join('\n')}
` : ''}

${ownershipNetwork.ownedCompanies && ownershipNetwork.ownedCompanies.length > 0 ? `
OWNERSHIP PORTFOLIO (Companies Owned by ${kycQuery}):
Total Companies: ${ownershipNetwork.totalCompanies}
High-Risk Ownership (≥50%): ${ownershipNetwork.highRiskOwnership}

Companies:
${ownershipNetwork.ownedCompanies.map(c =>
 `- ${c.company}: ${c.ownershipPercent}% (${c.ownershipType})${c.sanctionedOwner ? ' [SANCTIONED OWNER]' : ''}`
).join('\n')}
` : ''}

${ownershipNetwork.corporateStructure && ownershipNetwork.corporateStructure.length > 0 ? `
CORPORATE NETWORK (Related Entities):
${ownershipNetwork.corporateStructure.map(s =>
 `- ${s.entity} (${s.relationship}) - Common Owner: ${s.commonOwner} (${s.ownershipPercent}%) - Sanction Exposure: ${s.sanctionExposure}`
).join('\n')}
` : ''}`;

 const systemPrompt = `You are an expert compliance analyst with deep knowledge of AML/KYC regulations and sanctions programs.

SANCTIONS PROGRAMS (comprehensive knowledge required):
- OFAC SDN List (Specially Designated Nationals) - US Treasury blocking sanctions
- OFAC Sectoral Sanctions (SSI) - Russian energy, finance, defense sectors
- EU Consolidated Sanctions List - European Union sanctions
- UK Sanctions List (OFSI) - UK Office of Financial Sanctions Implementation
- UN Security Council Consolidated List - International sanctions
- CAATSA (Countering America's Adversaries Through Sanctions Act)

SANCTIONED RUSSIAN BANKS (ALL are SDN-listed as of 2024):
Sberbank, VTB, Gazprombank, Alfa-Bank, Bank Rossiya, Promsvyazbank, VEB.RF, Sovcombank,
Novikombank, Otkritie, Rosselkhozbank, Moscow Credit Bank, Transkapitalbank, Tinkoff Bank (restricted)

SANCTIONED SECTORS:
- Russian state-owned enterprises: Rosneft, Gazprom, Rostec, Transneft, Sovcomflot
- Iranian financial institutions and IRGC-linked entities
- North Korean entities (comprehensive blocking)
- Venezuelan PDVSA and government entities
- Chinese military-linked companies (Entity List, NDAA 1260H)
- Belarus state enterprises

CRITICAL SCREENING LOGIC:
1. For ANY Russian state-owned bank → Automatic MATCH, CRITICAL risk
2. For ANY Russian defense/energy SOE → Automatic MATCH, HIGH/CRITICAL risk
3. For entities 50%+ owned by sanctioned persons → BLOCKED by OFAC 50% rule
4. For PEPs → Always flag, assess proximity to sanctioned regimes
5. Check for aliases, transliterations (Cyrillic→Latin variations), name variations

RISK SCORING CRITERIA:
- CRITICAL: Direct SDN match, 50% rule triggered, active comprehensive sanctions
- HIGH: Sectoral sanctions, close PEP ties to sanctioned regime, significant adverse media
- MEDIUM: PEP status, indirect ownership exposure (25-49%), historical sanctions (delisted)
- LOW: No matches, no adverse findings, low-risk jurisdiction

IMPORTANT: The sanctions screening and ownership analysis below are REAL DATA from official sources. Use this data directly.

HIGH-PROFILE SANCTIONED INDIVIDUALS AND THEIR CORPORATE OWNERSHIP:
- OLEG DERIPASKA (SDN April 2018): Owns EN+ Group (48%), Rusal (48% indirect), Basic Element (100%)
- ALISHER USMANOV (SDN March 2022): Owns USM Holdings (100%), Metalloinvest (49%), MegaFon (15.2%)
- VIKTOR VEKSELBERG (SDN April 2018): Owns Renova Group (100%), Sulzer AG (63.4%), Columbus Nova (beneficial owner)
- ROMAN ABRAMOVICH (EU/UK/Canada March 2022): Owns Evraz (28.6%), Millhouse Capital (100%), formerly Chelsea FC
- GENNADY TIMCHENKO (SDN March 2014): Owns Volga Group (100%), Novatek (23.5%), Sibur (17%)
- ARKADY & BORIS ROTENBERG (SDN March 2014): Own SMP Bank (37.5% each), SGM Group (100%), Stroygazmontazh (51%)
- ALEXEI MORDASHOV (EU February 2022): Owns Severstal (77%), TUI AG (34%), Nordgold (90%)
- VLADIMIR POTANIN (UK June 2022): Owns Norilsk Nickel (34.6%), Interros (100%), Rosa Khutor (50%)
- VLADIMIR PUTIN (EU/UK/Canada/etc. Feb 2022): State control over Gazprom (50%+), Rosneft (50%+), Sberbank (50%+), VTB Bank (60.9%), Transneft (100%)

SANCTIONED ENTITIES: NIOC, IRGC, PDVSA, Rusal, EN+ Group, Gazprombank, Wagner Group, XPCC

OFAC 50% RULE: Entity owned 50%+ aggregate by blocked persons is itself blocked.

CRITICAL FOR OWNERSHIP EXTRACTION: When you identify ANY person in your analysis, you MUST check if they appear in the sanctioned individuals list above and include ALL their owned companies in the entities array. This is essential for complete sanctions risk assessment.

Return a JSON object with this EXACT structure (all fields required):
{
 "subject": {
 "name": "string",
 "type": "INDIVIDUAL|ENTITY",
 "aliases": ["array of known aliases or empty array"],
 "jurisdiction": "string or null",
 "incorporationDate": "YYYY-MM-DD or null",
 "stateOwned": true|false
 },
 "overallRisk": "LOW|MEDIUM|HIGH|CRITICAL",
 "riskScore": 0-100,
 "riskSummary": "2-3 sentence executive summary",
 "sanctions": {
 "status": "CLEAR|POTENTIAL_MATCH|MATCH",
 "confidence": 0-100,
 "matches": [{
 "list": "OFAC SDN|OFAC SSI|EU|UK|UN",
 "program": "RUSSIA-EO14024|UKRAINE-EO13662|etc",
 "listingDate": "YYYY-MM-DD",
 "matchedName": "exact name",
 "matchType": "EXACT|ALIAS|FUZZY",
 "matchScore": 0-100,
 "details": "reason",
 "source": "URL/reference"
 }]
 },
 "ownershipAnalysis": {
 "fiftyPercentRuleTriggered": boolean,
 "aggregateBlockedOwnership": 0-100,
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "summary": "plain language explanation",
 "beneficialOwners": [{
 "name": "string",
 "ownershipPercent": number,
 "ownershipType": "DIRECT|INDIRECT|BENEFICIAL",
 "sanctionStatus": "CLEAR|SANCTIONED|POTENTIAL",
 "sanctionDetails": "if sanctioned, list and program",
 "pepStatus": boolean,
 "source": "where from"
 }],
 "corporateStructure": [{
 "entity": "string",
 "relationship": "PARENT|SUBSIDIARY|AFFILIATE|SHAREHOLDER",
 "jurisdiction": "string",
 "ownershipPercent": number,
 "sanctionExposure": "NONE|INDIRECT|DIRECT",
 "notes": "string"
 }]
 },
 "pep": {
 "status": "CLEAR|POTENTIAL_MATCH|MATCH",
 "matches": [{
 "name": "string",
 "position": "role",
 "country": "string",
 "level": "NATIONAL|REGIONAL|LOCAL",
 "status": "CURRENT|FORMER",
 "riskLevel": "HIGH|MEDIUM|LOW",
 "relationshipToSubject": "SELF|FAMILY|CLOSE_ASSOCIATE",
 "sanctionedRegimeConnection": boolean
 }]
 },
 "adverseMedia": {
 "status": "CLEAR|FINDINGS",
 "totalArticles": number,
 "categories": {
 "FINANCIAL_CRIME": number,
 "CORRUPTION": number,
 "FRAUD": number,
 "SANCTIONS_EVASION": number,
 "MONEY_LAUNDERING": number,
 "OTHER": number
 },
 "articles": [{
 "headline": "string",
 "source": "publication",
 "sourceCredibility": "HIGH|MEDIUM|LOW",
 "date": "YYYY-MM-DD",
 "summary": "string",
 "category": "FINANCIAL_CRIME|CORRUPTION|FRAUD|SANCTIONS_EVASION|MONEY_LAUNDERING|OTHER",
 "relevance": "HIGH|MEDIUM|LOW"
 }]
 },
 "riskFactors": [{
 "factor": "short name",
 "severity": "CRITICAL|HIGH|MEDIUM|LOW",
 "description": "detailed explanation",
 "mitigants": "if any or empty"
 }],
 "regulatoryGuidance": {
 "ofacImplications": "detailed guidance",
 "euImplications": "if relevant or empty",
 "dueDiligenceRequired": "EDD|SDD|STANDARD",
 "filingRequirements": ["SAR", "CTR", "FBAR"],
 "prohibitedActivities": ["list"],
 "licenseRequired": boolean
 },
 "recommendations": [{
 "priority": "HIGH|MEDIUM|LOW",
 "action": "specific step",
 "rationale": "why matters",
 "deadline": "if time-sensitive or empty"
 }]
}

VALIDATION: If Sberbank/VTB/Gazprombank → MATCH/CRITICAL. If sanctions.status=MATCH → overallRisk=HIGH/CRITICAL. If fiftyPercentRuleTriggered=true → overallRisk=CRITICAL

IMPORTANT FOR ENTITIES: Always populate corporateStructure with parent companies, subsidiaries, and affiliates. Include their jurisdiction, ownership percentage, and sanction exposure level.

IMPORTANT FOR INDIVIDUALS: Include any known corporate affiliations in corporateStructure showing companies they own or control.

Always return complete, detailed responses with all arrays populated.`;

 const userPrompt = `${realDataContext}

Based on the REAL sanctions and ownership data above, complete the KYC screening for: ${kycQuery}${kycYearOfBirth ? ', Year of Birth: ' + kycYearOfBirth : ''}${kycCountry ? ', Country: ' + kycCountry : ''} (${kycType === 'individual' ? 'INDIVIDUAL' : 'ENTITY'})

Use the verified sanctions data provided. Add additional analysis for:
- PEP (Politically Exposed Person) status
- Adverse media findings
- Risk assessment
- Regulatory guidance

${kycType === 'entity' ? 'Include corporate structure with parent companies, subsidiaries, and affiliates.' : 'Include any corporate affiliations in corporateStructure.'}`;

 // Step 4: AI-powered risk analysis
 setScreeningStep('Step 4/5: Running AI-powered risk analysis...');
 setScreeningProgress(65);

 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 4000,
 messages: [
 { role: "user", content: systemPrompt + "\n\n" + userPrompt }
 ]
 })
 });

 if (!response.ok) {
 throw new Error("API error: " + response.status);
 }

 const data = await response.json();
 setScreeningProgress(85);
 const text = data.content && data.content[0] && data.content[0].text ? data.content[0].text : "";

 // Step 5: Compiling results
 setScreeningStep('Step 5/5: Compiling screening report...');
 setScreeningProgress(90);

 const jsonMatch = text.match(/\{[\s\S]*\}/);
 if (jsonMatch) {
 const parsed = JSON.parse(jsonMatch[0]);
 
 const isLowRisk = parsed.overallRisk === 'LOW' &&
 parsed.sanctions && parsed.sanctions.status === 'CLEAR' &&
 parsed.pep && parsed.pep.status === 'CLEAR' &&
 parsed.adverseMedia && parsed.adverseMedia.status === 'CLEAR';

 // Add ownership network data to results
 const finalResult = isLowRisk ? Object.assign({}, parsed, { noRisksIdentified: true }) : parsed;

 // Add owned companies for individuals
 if (ownershipNetwork.ownedCompanies) {
 finalResult.ownedCompanies = ownershipNetwork.ownedCompanies;
 finalResult.totalCompanies = ownershipNetwork.totalCompanies;
 finalResult.highRiskOwnership = ownershipNetwork.highRiskOwnership;
 }

 // Add corporate network for entities
 if (ownershipNetwork.corporateStructure) {
 if (!finalResult.ownershipAnalysis) finalResult.ownershipAnalysis = {};
 finalResult.ownershipAnalysis.corporateStructure = ownershipNetwork.corporateStructure;
 }

 setKycResults(finalResult);
 
 const historyItem = {
 id: Math.random().toString(36).substr(2, 9),
 query: kycQuery,
 type: kycType,
 clientRef: kycClientRef,
 yearOfBirth: kycYearOfBirth,
 country: kycCountry,
 result: finalResult,
 timestamp: new Date().toISOString()
 };
 
 setKycHistory(function(prev) { return [historyItem].concat(prev).slice(0, 50); });
 setSelectedHistoryItem(historyItem);
 setScreeningProgress(100);
 setScreeningStep('Complete!');
 setTimeout(() => {
 setKycPage('results');
 setIsScreening(false);
 setScreeningStep('');
 setScreeningProgress(0);
 }, 500);
 } else {
 alert('No results returned. Please try again.');
 setIsScreening(false);
 setScreeningStep('');
 setScreeningProgress(0);
 }
 } catch (error) {
 console.error('Sanctions API error:', error);
 alert('Error: ' + error.message);
 setIsScreening(false);
 setScreeningStep('');
 setScreeningProgress(0);
 }
 };

 const clearKycResults = () => {
 setKycResults(null);
 setKycQuery('');
 setKycClientRef('');
 setKycYearOfBirth('');
 setKycCountry('');
 setSelectedHistoryItem(null);
 setKycChatMessages([]);
 setKycChatOpen(false);
 };

 // View a historical screening result
 const viewHistoryItem = (item) => {
 setSelectedHistoryItem(item);
 setKycResults(item.result);
 setKycQuery(item.query);
 setKycClientRef(item.clientRef || '');
 setKycYearOfBirth(item.yearOfBirth || '');
 setKycCountry(item.country || '');
 setKycType(item.type);
 setKycPage('results');
 };

 // Create a new project
 const createProject = () => {
 if (!newProjectName.trim()) return;
 const project = {
 id: Math.random().toString(36).substr(2, 9),
 name: newProjectName.trim(),
 createdAt: new Date().toISOString(),
 screenings: []
 };
 setKycProjects(prev => [project, ...prev]);
 setNewProjectName('');
 };

 // Add screening to project
 const addToProject = (screeningId, projectId) => {
 setKycProjects(prev => prev.map(p => {
 if (p.id === projectId) {
 if (!p.screenings.includes(screeningId)) {
 return { ...p, screenings: [...p.screenings, screeningId] };
 }
 }
 return p;
 }));
 setAssigningToProject(null);
 };

 // Remove screening from project
 const removeFromProject = (screeningId, projectId) => {
 setKycProjects(prev => prev.map(p => {
 if (p.id === projectId) {
 return { ...p, screenings: p.screenings.filter(s => s !== screeningId) };
 }
 return p;
 }));
 };

 // Delete project
 const deleteProject = (projectId) => {
 setKycProjects(prev => prev.filter(p => p.id !== projectId));
 if (selectedProject?.id === projectId) {
 setSelectedProject(null);
 }
 };

 // Generate PDF report
 const generatePdfReport = async (screening) => {
 setIsGeneratingPdf(true);
 
 const result = screening.result;
 const timestamp = new Date(screening.timestamp).toLocaleString();
 
 // Create PDF content using the API
 const pdfPrompt = `Generate a professional KYC screening report in clean, structured text format for the following screening result. This will be converted to PDF for audit purposes.

SCREENING DETAILS:
- Subject: ${result.subject?.name}
- Type: ${result.subject?.type}
- Screening Date: ${timestamp}
- Client Reference: ${screening.clientRef || 'N/A'}
- Year of Birth: ${screening.yearOfBirth || 'N/A'}
- Country: ${screening.country || 'N/A'}
- Overall Risk: ${result.overallRisk}

RESULTS DATA:
${JSON.stringify(result, null, 2)}

Format the report with these sections:
1. EXECUTIVE SUMMARY
2. SUBJECT INFORMATION
3. SANCTIONS SCREENING RESULTS
4. OFAC 50% RULE / OWNERSHIP ANALYSIS (if applicable)
5. PEP SCREENING RESULTS
6. ADVERSE MEDIA FINDINGS
7. RISK FACTORS
8. REGULATORY GUIDANCE
9. RECOMMENDATIONS
10. AUDIT TRAIL (screening parameters, timestamp, etc.)

Make it professional and suitable for compliance records. Use clear headers and bullet points where appropriate.`;

 try {
 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 4000,
 messages: [{ role: "user", content: pdfPrompt }]
 })
 });

 if (!response.ok) {
 throw new Error(`API error: ${response.status}`);
 }

 const data = await response.json();
 const reportText = data.content?.map(item => item.text || "").join("\n") || "";
 
 if (!reportText) {
 throw new Error('Empty response');
 }
 
 // Create downloadable text file (in browser, we'll use a blob)
 const blob = new Blob([reportText], { type: 'text/plain' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `KYC_Report_${result.subject?.name?.replace(/\s+/g, '_') || 'Unknown'}_${new Date().toISOString().split('T')[0]}.txt`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 } catch (error) {
 console.error('PDF generation error:', error);
 alert('Error generating report. Please try again.');
 } finally {
 setIsGeneratingPdf(false);
 }
 };

 // Generate full case investigation report
 const generateCaseReport = async () => { // eslint-disable-line no-unused-vars
 if (!analysis || !activeCase) return;
 
 setIsGeneratingCaseReport(true);
 
 const caseData = {
 caseName: activeCase.name,
 createdAt: activeCase.createdAt,
 riskLevel: analysis.executiveSummary?.riskLevel,
 executiveSummary: analysis.executiveSummary,
 entities: analysis.entities,
 timeline: analysis.timeline,
 typologies: analysis.typologies,
 hypotheses: analysis.hypotheses,
 patterns: analysis.patterns,
 contradictions: analysis.contradictions,
 relationships: analysis.relationships,
 nextSteps: analysis.nextSteps,
 documents: files.map(f => f.name)
 };

 const reportPrompt = `Generate a comprehensive investigation report in professional format. This is for a financial crime/fraud investigation case file.

CASE DATA:
${JSON.stringify(caseData, null, 2)}

Create a detailed report with these sections:

1. CASE INFORMATION
 - Case Name, Date, Risk Classification

2. EXECUTIVE SUMMARY
 - Overview of findings
 - Primary concerns
 - Risk assessment
 - Recommended actions

3. ENTITIES OF INTEREST
 - For each entity: name, type, role, risk level, indicators, evidence citations

4. TYPOLOGIES IDENTIFIED
 - Financial crime typologies detected (money laundering, fraud, etc.)
 - Red flags and indicators for each
 - Regulatory implications

5. CHRONOLOGICAL TIMELINE (ONLY include this section if timeline events exist in the data)
 - Date-ordered events with significance and risk levels
 - Evidence citations for each event

6. HYPOTHESES & ANALYSIS
 - Each hypothesis with confidence score
 - Supporting evidence
 - Contradicting evidence
 - Investigative gaps

7. CONTRADICTIONS & DISCREPANCIES
 - Conflicting claims identified
 - Impact on investigation

8. RELATIONSHIP MAPPING
 - Connections between entities
 - Nature of relationships
 - Evidence supporting connections

9. RECOMMENDED NEXT STEPS
 - Prioritized investigative actions
 - Rationale for each

10. EVIDENCE INDEX
 - List of source documents analyzed

11. AUDIT TRAIL
 - Report generation timestamp
 - Analysis methodology note

Format the report professionally with clear headers, bullet points where appropriate, and maintain all evidence citations in [Doc X] format. This report should be suitable for regulatory submission or law enforcement referral.`;

 try {
 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 8000,
 messages: [{ role: "user", content: reportPrompt }]
 })
 });

 if (!response.ok) {
 throw new Error(`API error: ${response.status}`);
 }

 const data = await response.json();
 const reportText = data.content?.map(item => item.text || "").join("\n") || "";
 
 if (!reportText) {
 throw new Error('Empty response');
 }
 
 // Create downloadable file
 const blob = new Blob([reportText], { type: 'text/plain' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `Investigation_Report_${activeCase.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 } catch (error) {
 console.error('Case report generation error:', error);
 alert('Error generating report. Please try again.');
 } finally {
 setIsGeneratingCaseReport(false);
 }
 };

 // Generate actual PDF report with Marlowe visual style
 const generateCaseReportPdf = () => {
 if (!analysis || !activeCase) return;

 setIsGeneratingCaseReport(true);

 try {
 const pdf = new jsPDF();
 const pageWidth = pdf.internal.pageSize.getWidth();
 const pageHeight = pdf.internal.pageSize.getHeight();
 const margin = 20;
 const contentWidth = pageWidth - 2 * margin;
 let yPos = margin;

 // Helper function to add new page if needed
 const checkPageBreak = (requiredSpace = 20) => {
 if (yPos + requiredSpace > pageHeight - margin) {
 pdf.addPage();
 yPos = margin;
 return true;
 }
 return false;
 };

 // Helper to add text with word wrap
 const addText = (text, fontSize = 10, fontStyle = 'normal', color = [0, 0, 0]) => {
 pdf.setFontSize(fontSize);
 pdf.setFont('helvetica', fontStyle);
 pdf.setTextColor(...color);
 const lines = pdf.splitTextToSize(text, contentWidth);
 lines.forEach(line => {
 checkPageBreak();
 pdf.text(line, margin, yPos);
 yPos += fontSize * 0.5;
 });
 yPos += 3;
 };

 // Light background color for headers (Light theme: #f8f8f8)
 const lightBg = [248, 248, 248];
 // Cyan accent for light theme
 const accentColor = [6, 182, 212]; // cyan-500
 // Dark text for light theme
 const darkText = [17, 24, 39]; // gray-900

 // HEADER - Light background with accent text
 pdf.setFillColor(...lightBg);
 pdf.rect(0, 0, pageWidth, 50, 'F');
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(24);
 pdf.setFont('helvetica', 'bold');
 pdf.text('CIPHER INVESTIGATION REPORT', pageWidth / 2, 20, { align: 'center' });
 pdf.setFontSize(10);
 pdf.setTextColor(...darkText);
 pdf.text('Financial Crimes Analysis', pageWidth / 2, 30, { align: 'center' });

 // Risk badge
 const getRiskColor = (risk) => {
 switch (risk) {
 case 'CRITICAL': return [220, 38, 38]; // red-600
 case 'HIGH': return [244, 63, 94]; // rose-500
 case 'MEDIUM': return [245, 158, 11]; // amber-500
 case 'LOW': return [16, 185, 129]; // emerald-500
 default: return [148, 163, 184]; // slate
 }
 };
 const riskLevel = analysis.executiveSummary?.riskLevel || 'UNKNOWN';
 pdf.setFillColor(...getRiskColor(riskLevel));
 pdf.roundedRect(pageWidth / 2 - 20, 35, 40, 8, 2, 2, 'F');
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(8);
 pdf.setFont('helvetica', 'bold');
 pdf.text(riskLevel, pageWidth / 2, 40, { align: 'center' });

 yPos = 60;

 // CASE INFORMATION
 pdf.setDrawColor(...accentColor);
 pdf.setLineWidth(0.5);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;

 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text('CASE INFORMATION', margin, yPos);
 yPos += 8;

 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(10);
 pdf.setFont('helvetica', 'normal');
 addText(`Case Name: ${activeCase.name}`);
 addText(`Date Created: ${new Date(activeCase.createdAt).toLocaleString()}`);
 addText(`Report Generated: ${new Date().toLocaleString()}`);
 addText(`Documents Analyzed: ${files.length}`);
 yPos += 5;

 // EXECUTIVE SUMMARY
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text('EXECUTIVE SUMMARY', margin, yPos);
 yPos += 8;

 pdf.setTextColor(0, 0, 0);
 if (analysis.executiveSummary?.overview) {
 addText(analysis.executiveSummary.overview, 10);
 }
 if (analysis.executiveSummary?.primaryConcerns) {
 pdf.setFont('helvetica', 'bold');
 addText('Primary Concerns:', 10);
 pdf.setFont('helvetica', 'normal');
 analysis.executiveSummary.primaryConcerns.forEach(concern => {
 addText(`• ${concern}`, 9);
 });
 }
 if (analysis.executiveSummary?.recommendedActions) {
 yPos += 3;
 pdf.setFont('helvetica', 'bold');
 addText('Recommended Actions:', 10);
 pdf.setFont('helvetica', 'normal');
 analysis.executiveSummary.recommendedActions.forEach(action => {
 addText(`• ${action}`, 9);
 });
 }
 yPos += 5;

 // ENTITIES OF INTEREST
 if (analysis.entities && analysis.entities.length > 0) {
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text(`ENTITIES OF INTEREST (${analysis.entities.length})`, margin, yPos);
 yPos += 8;

 analysis.entities.slice(0, 10).forEach((entity, idx) => {
 checkPageBreak(25);
 pdf.setTextColor(...darkText);
 pdf.setFontSize(11);
 pdf.setFont('helvetica', 'bold');
 addText(`${idx + 1}. ${entity.name}`, 11);
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 addText(`Type: ${entity.type}`, 9);
 if (entity.role) addText(`Role: ${entity.role}`, 9);
 if (entity.riskLevel) {
 pdf.setTextColor(...getRiskColor(entity.riskLevel));
 addText(`Risk: ${entity.riskLevel}`, 9, 'bold');
 pdf.setTextColor(0, 0, 0);
 }
 yPos += 3;
 });
 }

 // TIMELINE
 if (analysis.timeline && analysis.timeline.length > 0) {
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text(`TIMELINE (${analysis.timeline.length} Events)`, margin, yPos);
 yPos += 8;

 analysis.timeline.slice(0, 15).forEach((event, idx) => {
 checkPageBreak(20);
 pdf.setTextColor(...darkText);
 pdf.setFontSize(10);
 pdf.setFont('helvetica', 'bold');
 addText(`${event.date || 'Date Unknown'}`, 10);
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 addText(event.description, 9);
 if (event.significance) {
 pdf.setFont('helvetica', 'italic');
 addText(`Significance: ${event.significance}`, 8, 'italic', darkText);
 }
 yPos += 2;
 });
 }

 // TYPOLOGIES
 if (analysis.typologies && analysis.typologies.length > 0) {
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text('FINANCIAL CRIME TYPOLOGIES', margin, yPos);
 yPos += 8;

 analysis.typologies.forEach((typo, idx) => {
 checkPageBreak(20);
 pdf.setTextColor(...darkText);
 pdf.setFontSize(11);
 pdf.setFont('helvetica', 'bold');
 addText(`${idx + 1}. ${typo.name}`, 11);
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 if (typo.description) addText(typo.description, 9);
 if (typo.confidence) addText(`Confidence: ${typo.confidence}%`, 9);
 yPos += 3;
 });
 }

 // HYPOTHESES
 if (analysis.hypotheses && analysis.hypotheses.length > 0) {
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text('INVESTIGATIVE HYPOTHESES', margin, yPos);
 yPos += 8;

 analysis.hypotheses.slice(0, 8).forEach((hyp, idx) => {
 checkPageBreak(25);
 pdf.setTextColor(...darkText);
 pdf.setFontSize(11);
 pdf.setFont('helvetica', 'bold');
 addText(`${idx + 1}. ${hyp.title}`, 11);
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 if (hyp.description) addText(hyp.description, 9);
 if (hyp.confidence !== undefined) {
 pdf.setTextColor(...accentColor);
 addText(`Confidence: ${Math.round((hyp.confidence || 0) * 100)}%`, 9, 'bold');
 pdf.setTextColor(0, 0, 0);
 }
 yPos += 3;
 });
 }

 // NEXT STEPS
 if (analysis.nextSteps && analysis.nextSteps.length > 0) {
 checkPageBreak(30);
 pdf.setDrawColor(...accentColor);
 pdf.line(margin, yPos, pageWidth - margin, yPos);
 yPos += 5;
 pdf.setTextColor(...accentColor);
 pdf.setFontSize(14);
 pdf.setFont('helvetica', 'bold');
 pdf.text('RECOMMENDED NEXT STEPS', margin, yPos);
 yPos += 8;

 analysis.nextSteps.forEach((step, idx) => {
 checkPageBreak(15);
 pdf.setTextColor(0, 0, 0);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 addText(`${idx + 1}. ${typeof step === 'string' ? step : step.action || step.description}`, 9);
 });
 }

 // FOOTER on last page
 const totalPages = pdf.internal.pages.length - 1;
 for (let i = 1; i <= totalPages; i++) {
 pdf.setPage(i);
 pdf.setFillColor(...lightBg);
 pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
 pdf.setTextColor(...darkText);
 pdf.setFontSize(8);
 pdf.text(`Marlowe Investigation Report | ${activeCase.name}`, margin, pageHeight - 8);
 pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
 }

 // Save the PDF
 pdf.save(`Marlowe_Investigation_${activeCase.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

 } catch (error) {
 console.error('PDF generation error:', error);
 alert('Error generating PDF. Please try again.');
 } finally {
 setIsGeneratingCaseReport(false);
 }
 };

 // Scroll KYC chat to bottom when new messages arrive
 useEffect(() => {
 if (kycChatEndRef.current) {
 kycChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
 }
 }, [kycChatMessages]);

 // KYC Chat function
 const sendKycChatMessage = async () => {
 if (!kycChatInput.trim() || isKycChatLoading || !kycResults) return;

 const userMessage = kycChatInput.trim();
 setKycChatInput('');
 setKycChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
 setIsKycChatLoading(true);

 const screeningContext = JSON.stringify(kycResults, null, 2);

 const conversationHistory = kycChatMessages.map(msg => ({
 role: msg.role,
 content: msg.content
 }));

 const systemPrompt = `You are a KYC compliance expert assistant. You have just completed a screening on "${kycResults.subject?.name}" and are now answering follow-up questions from the compliance analyst.

You have access to the complete screening results including:
- Sanctions screening results
- PEP (Politically Exposed Person) status
- Adverse media findings
- Ownership analysis and OFAC 50% Rule assessment
- Risk factors and recommendations

Always be specific and reference the screening data when making claims. Be concise but thorough.
Help the analyst understand the findings, suggest additional due diligence steps, and explain regulatory implications.

SCREENING RESULTS:
${screeningContext}

Subject Details:
- Name: ${kycResults.subject?.name}
- Type: ${kycResults.subject?.type}
- Overall Risk: ${kycResults.overallRisk}
${selectedHistoryItem?.clientRef ? `- Client Reference: ${selectedHistoryItem.clientRef}` : ''}
${selectedHistoryItem?.country ? `- Country: ${selectedHistoryItem.country}` : ''}
${selectedHistoryItem?.yearOfBirth ? `- Year of Birth: ${selectedHistoryItem.yearOfBirth}` : ''}`;

 try {
 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 2000,
 messages: [
 ...conversationHistory,
 { role: "user", content: `${systemPrompt}\n\nAnalyst question: ${userMessage}` }
 ]
 })
 });

 if (!response.ok) {
 throw new Error(`API error: ${response.status}`);
 }

 const data = await response.json();
 const assistantMessage = data.content?.map(item => item.text || "").join("\n") || "I couldn't process that request.";
 
 setKycChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
 } catch (error) {
 console.error('KYC chat error:', error);
 setKycChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
 } finally {
 setIsKycChatLoading(false);
 }
 };

 const handleDrag = useCallback((e) => {
 e.preventDefault();
 e.stopPropagation();
 if (e.type === "dragenter" || e.type === "dragover") {
 setDragActive(true);
 } else if (e.type === "dragleave") {
 setDragActive(false);
 }
 }, []);

 const processFiles = async (newFiles) => {
 const processedFiles = await Promise.all(
 Array.from(newFiles).map(async (file) => {
 let text = '';
 const fileName = file.name.toLowerCase();
 
 try {
 if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
 // Handle Word documents with mammoth
 const arrayBuffer = await file.arrayBuffer();
 const result = await mammoth.extractRawText({ arrayBuffer });
 text = result.value;
 } else if (fileName.endsWith('.pdf')) {
 // Handle PDF files with pdfjs-dist (client-side)
 const arrayBuffer = await file.arrayBuffer();
 const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
 const textParts = [];

 for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
 const page = await pdf.getPage(pageNum);
 const textContent = await page.getTextContent();
 const pageText = textContent.items.map(item => item.str).join(' ');
 textParts.push(pageText);
 }

 text = textParts.join('\n\n');
 console.log(`PDF extracted (${pdf.numPages} pages, ${text.length} chars):`, text.substring(0, 500));

 // Check if extraction yielded minimal text (likely scanned image PDF)
 if (!text || text.trim().length < 50) {
 text = `[PDF Processing Warning: ${file.name}]

This PDF appears to contain scanned images without a text layer, or the text extraction yielded minimal content.

File: ${file.name}
Size: ${(file.size / 1024).toFixed(1)} KB
Pages: ${pdf.numPages}

If this is a scanned document, please use OCR software to convert it to searchable PDF or text format.`;
 }
 } else {
 // Plain text files (txt, csv, json, xml, etc.)
 text = await file.text();
 }
 } catch (error) {
 console.error(`Error processing ${file.name}:`, error);
 text = `[Error reading file: ${file.name}]\n\nThe file could not be processed. Please try a different format.`;
 }
 
 return {
 id: Math.random().toString(36).substr(2, 9),
 name: file.name,
 type: file.type || 'text/plain',
 size: file.size,
 content: text,
 uploadedAt: new Date().toISOString()
 };
 })
 );
 setFiles(prev => [...prev, ...processedFiles]);
 };

 const handleDrop = useCallback((e) => {
 e.preventDefault();
 e.stopPropagation();
 setDragActive(false);
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 processFiles(e.dataTransfer.files);
 }
 }, []);

 const handleFileInput = (e) => {
 if (e.target.files && e.target.files[0]) {
 processFiles(e.target.files);
 }
 };

 const removeFile = (id) => {
 setFiles(prev => prev.filter(f => f.id !== id));
 };

 // Google Drive file picker handler
 const handleGoogleDrivePicker = () => {
 // Load Google Picker API
 const loadPicker = () => {
 const script = document.createElement('script');
 script.src = 'https://apis.google.com/js/api.js';
 script.onload = () => {
 window.gapi.load('picker', () => {
 createPicker();
 });
 };
 document.body.appendChild(script);
 };

 const createPicker = () => {
 // Note: In production, you'll need to set up Google Cloud project and get API credentials
 // For now, we'll show a simple file URL input as a placeholder
 const driveUrl = prompt('Enter Google Drive file sharing link:\n(In production, this will use Google Picker API)');

 if (driveUrl) {
 // Extract file ID from Drive URL
 const fileIdMatch = driveUrl.match(/[-\w]{25,}/);
 if (fileIdMatch) {
 const fileId = fileIdMatch[0];
 // In production, you would fetch the file here using Google Drive API
 alert(`File ID extracted: ${fileId}\n\nTo complete Google Drive integration:\n1. Set up Google Cloud project\n2. Enable Google Drive API\n3. Get OAuth 2.0 credentials\n4. Implement file download from Drive`);
 } else {
 alert('Invalid Google Drive link. Please use a valid sharing link.');
 }
 }
 };

 // Check if Google API is already loaded
 if (window.gapi) {
 window.gapi.load('picker', () => {
 createPicker();
 });
 } else {
 loadPicker();
 }
 };

 // Robust JSON repair function
 const repairJSON = (text) => {
 let str = text;

 // Step 1: Remove markdown code fences
 str = str.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

 // Step 2: Find JSON boundaries (outermost braces)
 const start = str.indexOf('{');
 const end = str.lastIndexOf('}');
 if (start === -1 || end === -1) {
 throw new Error('No valid JSON object found in response');
 }
 str = str.slice(start, end + 1);

 // Step 3: Remove comments
 str = str.replace(/\/\*[\s\S]*?\*\//g, '');
 str = str.replace(/\/\/.*/g, '');

 // Step 4: Fix trailing commas (most common LLM error)
 // Multiple passes to handle nested structures
 for (let pass = 0; pass < 15; pass++) {
 str = str.replace(/,(\s*[}\]])/g, '$1');
 str = str.replace(/,(\s*,)+/g, ',');
 str = str.replace(/([{[])\s*,/g, '$1');
 }

 // Step 5: Fix missing commas between elements
 str = str.replace(/}(\s*)\{/g, '},$1{');
 str = str.replace(/](\s*)\[/g, '],$1[');
 str = str.replace(/"(\s+)"/g, '",$1"');
 str = str.replace(/}(\s*)"([^"]+)":/g, '},$1"$2":');
 str = str.replace(/](\s*)"([^"]+)":/g, '],$1"$2":');
 str = str.replace(/([0-9]|\btrue\b|\bfalse\b|\bnull\b)(\s*)"([^"]+)":/g, '$1,$2"$3":');

 // Step 6: Fix property values that are split across lines
 str = str.replace(/"\s*\n\s*"/g, '",\n"');

 // Step 7: Handle unescaped quotes inside strings (best effort)
 // This is tricky - we'll try to fix obvious cases
 str = str.replace(/: "([^"]*)"([^"]*)"([^"]*)",/g, (match, p1, p2, p3) => {
 if (p2.includes(':') || p2.includes('{') || p2.includes('[')) {
 return match; // Don't modify - likely valid JSON structure
 }
 return `: "${p1}\\"${p2}\\"${p3}",`;
 });

 return str;
 };

 // Extract and parse JSON from LLM response with repair
 const extractJSON = (text) => {
 try {
 // Try direct parse first (fastest path)
 return JSON.parse(text);
 } catch (e) {
 // Try repairing
 try {
 const repaired = repairJSON(text);
 const parsed = JSON.parse(repaired);
 console.log('✅ JSON successfully repaired and parsed');
 return parsed;
 } catch (repairError) {
 console.error('❌ JSON repair failed:', repairError);
 console.error('Problematic text (first 500 chars):', text.substring(0, 500));
 console.error('Problematic text (last 500 chars):', text.substring(Math.max(0, text.length - 500)));

 // Try to identify the error location in repaired string
 const errorMatch = repairError.message.match(/position (\d+)/);
 if (errorMatch) {
 const repairedStr = repairJSON(text);
 const position = parseInt(errorMatch[1]);
 const contextStart = Math.max(0, position - 150);
 const contextEnd = Math.min(repairedStr.length, position + 150);
 console.error('Context around error:', repairedStr.substring(contextStart, contextEnd));
 }

 throw repairError;
 }
 }
 };

 // Retry wrapper for API calls with JSON parsing
 const callClaudeWithRetry = async (prompt, maxRetries = 2) => {
 let lastError = null;

 for (let attempt = 1; attempt <= maxRetries; attempt++) {
 try {
 console.log(`🔄 API attempt ${attempt}/${maxRetries}`);

 // Modify prompt for retries to emphasize valid JSON
 const enhancedPrompt = attempt > 1
 ? `${prompt}\n\n⚠️ CRITICAL: Your previous response had invalid JSON. Return ONLY a valid JSON object with NO trailing commas, NO comments, NO text before or after the JSON. Start with { and end with }.`
 : prompt;

 const response = await fetch('/api/messages', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 model: 'claude-sonnet-4-20250514',
 max_tokens: attempt === maxRetries ? 12000 : 16000, // Reduce tokens on final retry
 temperature: 0.3,
 messages: [{ role: 'user', content: enhancedPrompt }]
 })
 });

 if (!response.ok) {
 throw new Error(`API error: ${response.status}`);
 }

 const data = await response.json();
 const content = data.content[0].text;

 // Try to parse JSON
 const parsed = extractJSON(content);
 console.log(`✅ API call succeeded on attempt ${attempt}`);
 return parsed;

 } catch (error) {
 lastError = error;
 console.error(`❌ Attempt ${attempt} failed:`, error.message);

 if (attempt < maxRetries) {
 console.log(`🔄 Retrying with enhanced JSON instructions...`);
 await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
 }
 }
 }

 // All retries failed
 throw new Error(`API call failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
 };

 // Multi-step analysis pipeline
 const runAnalysisPipeline = async (files, caseDescription, onProgress) => { // eslint-disable-line no-unused-vars
 const steps = [
 { name: 'Extracting entities', progress: 10 },
 { name: 'Analyzing documents', progress: 20 },
 { name: 'Screening sanctions', progress: 30 },
 { name: 'Resolving identities', progress: 40 },
 { name: 'Mapping relationships', progress: 50 },
 { name: 'Building timeline', progress: 60 },
 { name: 'Identifying patterns', progress: 70 },
 { name: 'Generating hypotheses', progress: 80 },
 { name: 'Synthesizing findings', progress: 90 },
 { name: 'Finalizing analysis', progress: 100 }
 ];

 // Helper to update progress
 const updateProgress = (stepIndex) => {
   if (onProgress) {
     onProgress({
       currentStep: steps[stepIndex].name,
       stepNumber: stepIndex + 1,
       totalSteps: steps.length,
       progress: steps[stepIndex].progress
     });
   }
 };

 // JSON formatting reminder for all prompts
 const jsonReminder = `

CRITICAL: Return ONLY valid JSON. NO trailing commas. NO comments. Follow these rules:
- Every array element except the last must be followed by a comma
- The last element in an array must NOT have a trailing comma
- The last property in an object must NOT have a trailing comma
- All strings must use double quotes, not single quotes
- No comments (//) or (/* */)`;

 let pipelineData = {};

 // STEP 1: Extracting entities

 const evidenceContext = files.map((f, idx) => {
 const truncatedContent = f.content.length > 3000
 ? f.content.substring(0, 3000) + '\n\n[... content truncated ...]'
 : f.content;
 return `[DOCUMENT ${idx + 1}: "${f.name}"]\n${truncatedContent}\n[END DOCUMENT ${idx + 1}]`;
 }).join('\n\n');

 const step1Prompt = `STEP 1: DOCUMENT UNDERSTANDING

You are the world's leading financial crimes investigator with 30+ years of experience at FinCEN, OFAC, the FBI Financial Crimes Unit, and the Financial Action Task Force (FATF). You've investigated major cases including HSBC's $1.9B cartel money laundering, 1MDB ($4.5B embezzlement), Danske Bank's €200B Russian laundering scandal, and the Panama Papers.

CRITICAL REQUIREMENT: You MUST be crystal-clear and specific in ALL your findings. Never use vague language like "suspicious entities" or "concerning transactions." Instead:
- Name the EXACT entity type: "SPV", "shell company", "front company", "nominee arrangement", "brass plate company"
- State SPECIFIC red flags: "Formed 3 days before $5M transfer", "Registered at known corporate service provider address", "No employees, no operations"
- Quantify everything: "$2.5M mismatch", "48 hours between formation and transaction", "shares 1 address with 247 other companies"
- Be definitive in your reasoning: "This IS an SPV because..." not "This may be suspicious"

You are analyzing ${files.length} document(s) for a financial crimes investigation. Apply your deep expertise to identify:
- Money laundering typologies (placement, layering, integration) - STATE WHICH STAGE
- Trade-Based Money Laundering (TBML) red flags - SPECIFY the scheme (over/under invoicing, phantom shipments, etc.)
- Shell companies, SPVs, brass plate companies - IDENTIFY SPECIFICALLY
- Sanctions evasion schemes and front companies - NAME the evasion technique
- Beneficial ownership obfuscation - DETAIL the concealment method
- Invoice manipulation - QUANTIFY discrepancies
- Correspondent banking vulnerabilities - SPECIFY the weakness exploited
- Real estate and luxury goods laundering - NAME the asset types

For each document, identify with PRECISION:
- Document type (bank statement, invoice, contract, email, corporate registry, wire transfer, trade document, etc.)
- Date range covered (EXACT dates)
- Key parties mentioned (DISTINGUISH: legal owner vs. beneficial owner vs. nominee director)
- Primary purpose/content (BE SPECIFIC)
- **CRITICAL**: Red flags that indicate potential financial crime - BE EXPLICIT:
 * "Company X is a Special Purpose Vehicle (SPV) formed solely to receive this transfer"
 * "Invoice shows $500K for 'consulting services' with no deliverables = likely sham transaction"
 * "Wire transfer routed through 3 jurisdictions in 24 hours = layering"

${evidenceContext}

Respond with JSON:
{
 "documentSummaries": [
 {
 "docId": 1,
 "docName": "filename",
 "type": "document type",
 "dateRange": "date range or N/A",
 "keyParties": ["party1", "party2"],
 "purpose": "brief description of document purpose",
 "keyFindings": ["notable finding 1", "finding 2"]
 }
 ]
}${jsonReminder}`;

 updateProgress(0); // Extracting entities
 const step1JSON = await callClaudeWithRetry(step1Prompt);
 pipelineData.documentSummaries = step1JSON.documentSummaries || [];

 // STEP 2: Analyzing documents
 updateProgress(1);

 const step2Prompt = `STEP 2: ENTITY EXTRACTION & INTELLIGENCE GATHERING

You are an expert financial intelligence analyst trained in entity extraction for money laundering and sanctions evasion investigations. Your extraction techniques have identified hidden beneficial owners, uncovered nominee structures, and connected seemingly unrelated shell companies in major investigations.

CRITICAL REQUIREMENT: Be SPECIFIC about entity characteristics. For each entity extracted, identify:
- EXACT entity type: "SPV (Special Purpose Vehicle)", "Shell company", "Operating company", "Brass plate entity", "Nominee director", "Beneficial owner", "Front company"
- SPECIFIC red flags: "Formed [date] - only [X] days before [transaction]", "Shares address with [Y] other companies", "No physical office", "No employees visible", "Registered at [specific corporate service provider]"
- QUANTIFIED concerns: "Formed in [jurisdiction] known for 0% corporate tax", "Same nominee director on [X] unrelated companies"

You recognize sophisticated concealment techniques - NAME THEM SPECIFICALLY:
- **Nominee arrangements**: STATE "This is a nominee director arrangement" and list ALL companies where this person serves
- **Name variations**: IDENTIFY "Intentional misspelling to evade sanctions screening: [Example]"
- **Layered structures**: MAP the chain: "A owns 60% of B, B owns 75% of C = A has indirect 45% control of C"
- **High-risk jurisdictions**: NAME them: "BVI SPV", "Seychelles IBC", "Panama foundation", "Delaware LLC with anonymous ownership"
- **Recently formed entities**: QUANTIFY: "Formed [date], first transaction [date] = [X] day gap - indicates SPV created for this transaction"
- **Professional enablers**: NAME them: "Registered agent: [Company] at [Address] - appears on 500+ other entities"

Extract ONLY specific named entities from the documents.

DOCUMENT SUMMARIES:
${JSON.stringify(pipelineData.documentSummaries, null, 2)}

FULL EVIDENCE:
${evidenceContext}

Extract every:
- Person (including nominee directors, hidden beneficial owners)
- Organization (including shell companies, front companies)
- Bank account (for transaction analysis)
- Address (especially PO boxes, registered agent addresses)
- Date (for timeline construction)
- Transaction amount (for financial analysis)

CRITICAL RULES:
- PERSON: Specific named individuals (e.g., "John Smith", "Vladimir Putin")
 * DO NOT extract: job titles alone, roles, or generic references like "the CEO"
- ORGANIZATION: Specific named companies or entities (e.g., "Acme Corp", "Bank of America")
 * DO NOT extract: countries, regions, industries, or generic terms like "the bank" or "the government"
- ACCOUNT/ADDRESS/DATE/AMOUNT: Extract these for analysis purposes
 * These help build timelines, track transactions, and establish patterns

DO NOT EXTRACT:
- Countries or regions as entities (e.g., "Russia", "Middle East", "Europe")
- Industries or sectors (e.g., "the oil industry", "financial sector")
- Generic references (e.g., "the company", "the individual", "government officials")
- Job titles without names (e.g., "CEO", "Director", "Agent")
- Abstract concepts or categories

RED FLAGS TO WATCH:
- Nominee directors (same person on multiple unrelated companies)
- Layered ownership (A owns B owns C owns D)
- Secrecy jurisdictions (BVI, Cayman, Panama, Cyprus, UAE)
- Recently formed entities with large transactions
- PO Box / registered agent addresses
- Bearer shares

Respond with JSON:
{
 "rawEntities": [
 {
 "id": "e1",
 "name": "Entity Name",
 "type": "PERSON|ORGANIZATION|ACCOUNT|ADDRESS|DATE|AMOUNT",
 "mentions": [
 {"docId": 1, "context": "How entity appears in Doc 1"},
 {"docId": 2, "context": "How entity appears in Doc 2"}
 ],
 "redFlags": ["Any red flags observed"],
 "potentialDuplicates": ["e2", "e5"]
 }
 ]
}${jsonReminder}`;

 const step2JSON = await callClaudeWithRetry(step2Prompt);
 pipelineData.rawEntities = step2JSON.rawEntities || [];

 // STEP 2B: Screen all extracted entities for sanctions
 updateProgress(2);

 const sanctionsPrompt = `You are a sanctions compliance expert with comprehensive knowledge of:
- OFAC SDN List (US Treasury)
- EU Consolidated Sanctions List
- UK HM Treasury Sanctions List
- UN Security Council Sanctions
- FATF High-Risk Jurisdictions
- All other international sanctions regimes

ENTITIES TO SCREEN:
${JSON.stringify(step2JSON.rawEntities, null, 2)}

For EACH entity, determine:
1. **Sanctions Status**: Are they currently sanctioned by any jurisdiction? (MATCH/POTENTIAL_MATCH/CLEAR)
2. **Sanctioning Bodies**: Which lists? (e.g., "OFAC SDN", "EU", "UK", "UN")
3. **Listing Date**: When were they added?
4. **Programs**: What programs? (e.g., "RUSSIA", "IRAN", "NORTH KOREA", "COUNTER-NARCOTICS")
5. **Owned Entities**: What companies/entities do they own or control? (with ownership %)
6. **Beneficial Owners**: Who are the beneficial owners (if entity is a company)?

CRITICAL: If an entity is sanctioned and owns companies, AUTOMATICALLY ADD all their owned companies as additional entities in the "additionalEntities" array. Each additional entity must be a full entity object with all required fields.

For example, if Vladimir Putin is sanctioned and owns Gazprom, Rosneft, and Sberbank, you MUST include those companies in additionalEntities like this:

"additionalEntities": [
  {
    "id": "entity-gazprom",
    "name": "Gazprom",
    "type": "ORGANIZATION",
    "sanctionStatus": "CLEAR",
    "role": "State-owned gas company controlled by sanctioned individual",
    "riskLevel": "HIGH",
    "sanctionDetails": null,
    "ownedCompanies": [],
    "beneficialOwners": [
      {"name": "Vladimir Putin", "ownershipPercent": 50, "sanctionStatus": "MATCH"}
    ]
  }
]

Return JSON:
{
  "entities": [
    {
      "id": "entity-1",
      "name": "Entity Name",
      "type": "PERSON|ORGANIZATION",
      "sanctionStatus": "MATCH|POTENTIAL_MATCH|CLEAR",
      "sanctionDetails": {
        "lists": ["OFAC SDN", "EU"],
        "listingDate": "2022-02-24",
        "programs": ["RUSSIA"],
        "details": "Brief description"
      },
      "ownedCompanies": [
        {"company": "Company A", "ownershipPercent": 51.0, "ownershipType": "DIRECT"},
        {"company": "Company B", "ownershipPercent": 100.0, "ownershipType": "BENEFICIAL"}
      ],
      "beneficialOwners": [
        {"name": "Owner Name", "ownershipPercent": 60.0, "sanctionStatus": "MATCH"}
      ]
    }
  ],
  "additionalEntities": [
    // Full entity objects for all owned companies of sanctioned individuals
    // MUST include: id, name, type, role, riskLevel, sanctionStatus, sanctionDetails, ownedCompanies, beneficialOwners
  ]
}${jsonReminder}`;

 const sanctionsJSON = await callClaudeWithRetry(sanctionsPrompt);

 // Merge sanctions data into entities
 if (sanctionsJSON.entities && sanctionsJSON.entities.length > 0) {
   // Create a map of original entities by ID for merging
   const entityMap = new Map();
   pipelineData.rawEntities.forEach(entity => {
     entityMap.set(entity.id, entity);
   });

   // Merge sanctions data into original entities
   sanctionsJSON.entities.forEach(sanctionedEntity => {
     const originalEntity = entityMap.get(sanctionedEntity.id);
     if (originalEntity) {
       originalEntity.sanctionStatus = sanctionedEntity.sanctionStatus;
       originalEntity.sanctionDetails = sanctionedEntity.sanctionDetails;
       originalEntity.ownedCompanies = sanctionedEntity.ownedCompanies;
       originalEntity.beneficialOwners = sanctionedEntity.beneficialOwners;
     }
   });
 }

 // Add owned companies as new entities
 if (sanctionsJSON.additionalEntities && sanctionsJSON.additionalEntities.length > 0) {
   pipelineData.rawEntities.push(...sanctionsJSON.additionalEntities);
 }

 // STEP 3: Resolving identities
 updateProgress(3);

 const step3Prompt = `STEP 3: ENTITY RESOLUTION & IDENTITY ANALYSIS

You are a master entity resolution specialist with deep experience in financial intelligence databases, corporate registries, and sanctions list matching. Your fuzzy matching algorithms have connected aliases across multiple jurisdictions, identified beneficial owners hiding behind nominees, and linked shell companies to their controllers.

Apply sophisticated resolution techniques:
- **Name matching**: Handle transliteration variants (Russian/Arabic names), cultural naming conventions, nicknames, married names
- **Corporate entity matching**: Recognize legal entity suffixes (Ltd/Limited, Corp/Corporation, AG/GmbH, SA/SAS), DBA names, holding company relationships
- **Address normalization**: Same addresses with variations in formatting (registered agent addresses are common among shell companies)
- **Temporal consistency**: Consider whether the same person could reasonably be involved in events at different times/locations
- **Contextual clues**: Business relationships, shared contact details, overlapping board memberships
- **Suspicious patterns**: Multiple entities with nearly identical names (indicates structuring or concealment)

Red flags in entity resolution:
- Intentional name variations to evade sanctions screening
- Use of professional nominee directors (same person on 50+ companies)
- Rapid formation and dissolution of similar-named entities
- Entities sharing exact addresses but claiming independence

EXTRACTED ENTITIES:
${JSON.stringify(pipelineData.rawEntities, null, 2)}

Critical questions:
- Is "John Smith" in Doc 1 the same as "J. Smith" in Doc 3? Check context, dates, relationships.
- Is "ABC Corp" and "ABC Corporation Ltd" the same entity? Check jurisdiction, addresses, business activities.
- Are spelling variations intentional evasion tactics or innocent differences?
- Do multiple entities with similar names represent a single beneficial owner's network?

Build unified entity profiles by intelligently merging duplicates.

Respond with JSON:
{
 "resolvedEntities": [
 {
 "id": "resolved_e1",
 "canonicalName": "Official Entity Name",
 "aliases": ["variant 1", "variant 2"],
 "type": "PERSON|ORGANIZATION|ACCOUNT",
 "role": "role in investigation",
 "allMentions": [
 {"docId": 1, "context": "mention context", "name": "John Smith"},
 {"docId": 3, "context": "mention context", "name": "J. Smith"}
 ],
 "riskIndicators": ["red flags from extraction"],
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL"
 }
 ],
 "resolutionNotes": "Any ambiguous cases or assumptions made"
}${jsonReminder}`;

 const step3JSON = await callClaudeWithRetry(step3Prompt);
 pipelineData.resolvedEntities = step3JSON.resolvedEntities || [];

 // STEP 4: Mapping relationships
 updateProgress(4);

 const step4Prompt = `STEP 4: RELATIONSHIP MAPPING & NETWORK ANALYSIS

You are an elite network analyst specializing in unraveling complex ownership structures and hidden control mechanisms. Your expertise has exposed layered shell company networks in the Panama Papers, traced oligarch assets through nominee structures, and mapped cartel money flows through trade-based laundering schemes.

Apply your advanced techniques:
- **Beneficial ownership unmasking**: Identify ultimate beneficial owners (UBOs) behind nominee and strawman arrangements
- **Control without ownership**: Detect de facto control through board seats, voting agreements, management contracts, and loan covenants
- **Network centrality analysis**: Identify key nodes and critical chokepoints in financial networks
- **Indirect ownership calculations**: Trace ownership chains (if A owns 60% of B, and B owns 50% of C, then A indirectly owns 30% of C)
- **Time-based analysis**: Track ownership changes, especially around sanctions announcements or regulatory inquiries
- **Red flag patterns**: Circular ownership, cross-shareholdings, opaque intermediaries

Draw on your knowledge of concealment techniques:
- Liechtenstein anstalts and Panama foundations
- Seychelles IBCs and BVI trusts
- Bearer share instruments
- Nominee director services in secrecy jurisdictions
- Dutch sandwich and Irish double structures (corporate tax evasion patterns that mirror ML structures)

RESOLVED ENTITIES:
${JSON.stringify(pipelineData.resolvedEntities, null, 2)}

DOCUMENTS:
${evidenceContext}

Map ALL connections:
- **Ownership**: Direct and indirect percentages, legal vs. beneficial ownership
- **Control**: Board seats, signatory authority, management agreements, voting rights
- **Family/Associate networks**: Relatives, close associates, known criminal affiliates
- **Business relationships**: Supplier, customer, partner, competitor
- **Financial flows**: Lender, borrower, guarantor, investor, fund transfers
- **Transactional**: Wire transfers, payments, invoices, contracts

Respond with JSON:
{
 "relationships": [
 {
 "entity1": "resolved_e1",
 "entity2": "resolved_e2",
 "relationshipType": "ownership|control|family|business|financial|transaction",
 "description": "Nature of relationship",
 "percentage": 0,
 "direct": true,
 "citations": ["Doc 1", "Doc 2"]
 }
 ],
 "ownershipChains": [
 {
 "ultimateBeneficialOwner": "Person X",
 "controlledEntity": "Company Y",
 "ownershipPercent": 45.5,
 "chain": "Person X -> (90%) -> Company A -> (50.5%) -> Company Y",
 "significantControl": true
 }
 ]
}${jsonReminder}`;

 const step4JSON = await callClaudeWithRetry(step4Prompt);
 pipelineData.relationships = step4JSON.relationships || [];
 pipelineData.ownershipChains = step4JSON.ownershipChains || [];

 // STEP 5: Building timeline
 updateProgress(5);

 const step5Prompt = `STEP 5: TIMELINE CONSTRUCTION

Extract ALL dated events and build a chronological timeline.

DOCUMENTS:
${evidenceContext}

RESOLVED ENTITIES:
${JSON.stringify(pipelineData.resolvedEntities.slice(0, 10), null, 2)}

Extract every date and event. Look for:
- Transaction dates
- Corporate formation dates
- Changes in ownership/control
- Sanctions listing dates
- Document signing dates
- Timing clusters (many events in short period)
- Suspicious gaps (periods with no activity)

Respond with JSON:
{
 "timeline": [
 {
 "id": "tl1",
 "date": "YYYY-MM-DD or description",
 "event": "What happened",
 "entitiesInvolved": ["resolved_e1", "resolved_e2"],
 "significance": "Why this matters",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "citations": ["Doc 1"]
 }
 ],
 "timelineAnalysis": {
 "timelineClusters": ["2022-03: 5 events in 2 weeks (unusual velocity)"],
 "suspiciousGaps": ["2021-06 to 2021-12: No activity despite ongoing business operations"],
 "keyMilestones": ["2020-01: Company formation", "2022-03: Sanctions listing"]
 }
}${jsonReminder}`;

 const step5JSON = await callClaudeWithRetry(step5Prompt);
 pipelineData.timeline = step5JSON.timeline || [];
 pipelineData.timelineAnalysis = step5JSON.timelineAnalysis || {};

 // STEP 6: Identifying patterns
 updateProgress(6);

 const step6Prompt = `STEP 6: PATTERN DETECTION & TYPOLOGY ANALYSIS

You are the world's foremost expert on financial crime typologies, having written the definitive guides on money laundering, sanctions evasion, and fraud detection used by global regulators. You've trained investigators at FATF, Europol, OFAC, and the Egmont Group. Your pattern recognition capabilities rival the best AI systems used by major banks' financial intelligence units.

CRITICAL REQUIREMENT FOR CRYSTAL-CLEAR ANALYSIS:
- NAME the specific typology: "Trade-Based Money Laundering via Over-Invoicing", NOT "suspicious trade activity"
- NAME the specific scheme: "Loan-Back Scheme", "Mirror Trading", "Smurfing", "SPV Layering", NOT "complex transactions"
- QUANTIFY everything: "$2.5M over-invoiced by 300%", "5 wire transfers totaling $10M in 48 hours", "SPV formed 72 hours before receiving $8M"
- STATE the exact mechanism: "Funds placed via cash deposits, layered through 3 SPVs in BVI/Cayman/Cyprus, integrated via UK real estate purchase"
- BE DEFINITIVE: "This IS trade-based laundering via phantom shipping" NOT "This appears suspicious"
- CITE evidence: "[Doc 3, page 5: Invoice #12345 shows $500K for 100 laptops = $5,000/unit vs. market price $800/unit = 525% overpricing]"

Draw on your encyclopedic knowledge of real-world case structures:
- Black Market Peso Exchange: Colombian cartels laundering via over-invoiced exports
- Russian Laundromat: $20B through Baltic mirror trades (simultaneous buy/sell)
- 1MDB: SPV networks in Seychelles/Cayman funneling funds through Singapore/Switzerland
- Real estate laundering: Anonymous LLC purchases of luxury condos
- Sanctions evasion: Front companies re-flagging vessels, transshipment via third countries
- 50% Rule circumvention: Nested ownership (SPV owns SPV owns target = diluted control)
- Mirror trading: Buy in rubles, sell in USD = capital flight
- Correspondent banking: Nested accounts masking true originators

Conduct a COMPREHENSIVE analysis identifying ALL typologies present with SPECIFIC NAMES AND MECHANISMS.

PIPELINE DATA SO FAR:
- Documents: ${pipelineData.documentSummaries.length}
- Entities: ${pipelineData.resolvedEntities.length}
- Relationships: ${pipelineData.relationships.length}
- Timeline Events: ${pipelineData.timeline.length}

ENTITIES:
${JSON.stringify(pipelineData.resolvedEntities, null, 2)}

RELATIONSHIPS:
${JSON.stringify(pipelineData.relationships, null, 2)}

TIMELINE:
${JSON.stringify(pipelineData.timeline, null, 2)}

COMPREHENSIVE TYPOLOGY ANALYSIS - Examine the evidence for ALL of these:

SANCTIONS EVASION:
- 50% Rule exposure (aggregate blocked ownership ≥50%)
- Front companies (recently formed entities acting for blocked persons)
- Shell companies in secrecy jurisdictions
- Nominee directors/straw owners
- Falsified shipping documents
- Transshipment through third countries
- Ownership changes timed with sanctions announcements
- Use of cutouts and intermediaries
- Asset concealment through layered structures

MONEY LAUNDERING (3 stages):
PLACEMENT:
- Structuring (smurfing) - transactions just below $10k threshold
- Cash-intensive businesses
- Bulk cash smuggling
- Currency exchanges

LAYERING:
- Rapid fund movement between accounts
- Round-dollar wire transfers
- Complex ownership chains
- Use of shell companies
- International wire transfers to high-risk jurisdictions
- Trade-based laundering (over/under invoicing)
- Loan-back schemes

INTEGRATION:
- Funnel accounts (many in → one out, or one in → many out)
- Commingling with legitimate funds
- Real estate purchases
- Luxury goods acquisition

FRAUD:
- Document inconsistencies (dates, signatures, amounts don't match)
- Phantom entities (exist on paper only, no real operations)
- Conflicts of interest (same person on both sides of transaction)
- Altered financial statements
- Invoice fraud (over-billing, phantom invoicing)
- Kickback schemes
- False representations

CORRUPTION & BRIBERY:
- Politically Exposed Persons (PEPs) involvement
- Government contracts with unusual terms
- Consulting agreements with no deliverables
- Family members of officials receiving payments
- Offshore accounts in PEP networks

TERRORIST FINANCING:
- Small transactions to high-risk regions
- Charity front organizations
- Hawala/informal value transfer
- Prepaid cards, gift cards

OTHER RED FLAGS:
- Inconsistent business profiles (small company, huge transactions)
- Jurisdictional arbitrage (entities in tax havens, secrecy jurisdictions)
- Recently formed entities with immediate large activity
- Missing documentation
- Unusual transaction timing
- PO Box addresses, registered agent addresses
- Bearer shares or undisclosed ownership
- Related party transactions without economic rationale

INSTRUCTIONS:
1. Identify ALL typologies that match the evidence (don't limit to just 3)
2. For each typology, cite SPECIFIC evidence from documents
3. Include both definitive patterns AND suspicious indicators worth noting
4. Differentiate between HIGH-CONFIDENCE typologies (clear evidence) and MODERATE-CONFIDENCE ones (indicators present)

Respond with JSON:
{
 "patterns": [
 {
 "name": "Pattern name",
 "category": "SANCTIONS_EVASION|MONEY_LAUNDERING|FRAUD|OTHER",
 "description": "Detailed pattern description",
 "instances": ["Instance 1 [Doc X]", "Instance 2 [Doc Y]"],
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL"
 }
 ],
 "typologies": [
 {
 "id": "t1",
 "name": "Specific typology name (e.g., 'Layering Through Shell Companies', 'Structuring to Avoid CTR Reporting')",
 "category": "MONEY_LAUNDERING_PLACEMENT|MONEY_LAUNDERING_LAYERING|MONEY_LAUNDERING_INTEGRATION|FRAUD|SANCTIONS_EVASION|CORRUPTION|TERRORIST_FINANCING|OTHER",
 "confidence": "HIGH|MODERATE|LOW",
 "description": "How this specific typology manifests in this case with concrete examples",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "indicators": ["Specific indicator 1 [Doc X, page Y]", "Indicator 2 [Doc Z]"],
 "redFlags": ["Concrete red flag 1", "Red flag 2"],
 "entitiesInvolved": ["entity_id_1", "entity_id_2"],
 "regulatoryRelevance": "BSA Section 314(a)|OFAC 50% Rule|EU Sanctions Regulation|SAR reporting required|etc",
 "evidenceStrength": "STRONG|MODERATE|WEAK"
 }
 ],
 "investigatorNotes": "Brief summary: X typologies identified with high confidence, Y with moderate confidence. Most concerning: [brief note]"
}${jsonReminder}`;

 const step6JSON = await callClaudeWithRetry(step6Prompt);
 pipelineData.patterns = step6JSON.patterns || [];
 pipelineData.typologies = step6JSON.typologies || [];

 // STEP 7: Generating hypotheses
 updateProgress(7);

 const step7Prompt = `STEP 7: HYPOTHESIS GENERATION & INVESTIGATIVE THEORIZATION

You are a master investigative strategist, having led complex multi-jurisdictional investigations that resulted in landmark prosecutions and regulatory actions. Your hypothesis generation methodology has been adopted by the FBI, Interpol, and major financial institutions' investigative units.

Apply your proven framework for building prosecutable cases:
1. **Alternative hypothesis testing**: Consider multiple competing theories, including innocent explanations
2. **Bayesian reasoning**: Assign confidence based on evidence strength and prior probabilities
3. **Investigative gap analysis**: Identify exactly what evidence would definitively prove/disprove each theory
4. **Prosecutorial viability**: Assess what would convince a jury or regulatory body
5. **Defense counter-arguments**: Anticipate how each hypothesis could be challenged

Draw on your experience with:
- Building RICO cases against transnational criminal organizations
- Financial intelligence analysis for national security investigations
- Asset forfeiture cases requiring clear beneficial ownership proof
- SAR-to-prosecution pipelines at major enforcement agencies

TYPOLOGIES DETECTED:
${JSON.stringify(pipelineData.typologies, null, 2)}

Generate 3-5 competing hypotheses explaining the evidence. For each:
- What is the theory?
- What evidence supports it?
- What evidence contradicts it?
- What additional evidence would prove/disprove it?
- Confidence level (0-1)

Respond with JSON:
{
 "hypotheses": [
 {
 "id": "h1",
 "title": "Clear hypothesis statement",
 "description": "Detailed 2-3 sentence explanation",
 "confidence": 0.75,
 "supportingEvidence": ["Evidence 1 [Doc X]", "Evidence 2 [Doc Y]"],
 "contradictingEvidence": ["Counter-evidence 1 [Doc Z]"],
 "investigativeGaps": ["What data would prove/disprove this", "Gap 2"],
 "implications": "What this would mean if true"
 }
 ],
 "contradictions": [
 {
 "description": "Contradiction in evidence",
 "source1": "Evidence piece 1 [Doc X]",
 "source2": "Conflicting evidence [Doc Y]",
 "resolution": "Possible explanation"
 }
 ]
}${jsonReminder}`;

 const step7JSON = await callClaudeWithRetry(step7Prompt);
 pipelineData.hypotheses = step7JSON.hypotheses || [];
 pipelineData.contradictions = step7JSON.contradictions || [];

 // STEP 8: Synthesis
 updateProgress(8);

 const investigationContext = caseDescription.trim()
 ? `INVESTIGATION CONTEXT:\n${caseDescription}\n\n`
 : '';

 const step8Prompt = `STEP 8: SYNTHESIS & STRATEGIC INTELLIGENCE ASSESSMENT

You are now synthesizing all findings into an actionable intelligence report that will guide high-stakes decisions by compliance officers, law enforcement, prosecutors, and regulators.

CRITICAL REQUIREMENT FOR CRYSTAL-CLEAR REPORTING:

**Executive Summary MUST include:**
- SPECIFIC entity types identified: "3 SPVs", "2 shell companies", "1 nominee director arrangement", NOT "several suspicious entities"
- EXACT typologies detected: "Trade-Based Money Laundering via 325% Over-Invoicing", "SPV Layering Scheme", NOT "money laundering indicators"
- QUANTIFIED concerns: "$8.5M transferred through 4 jurisdictions in 72 hours", "Company formed March 1, first transaction March 4 = 3-day gap indicating purpose-built SPV"
- DEFINITIVE risk assessment: "HIGH risk due to: (1) SPV structure, (2) $5M mismatch, (3) sanctioned party connection" NOT "elevated concerns"
- SPECIFIC recommended actions: "Issue subpoena for XYZ Bank records covering Jan-Mar 2024", "Request corporate registry docs for ABC Ltd (BVI IBC #12345)", NOT "gather additional information"

**Primary Concerns MUST be specific:**
❌ VAGUE: "Suspicious corporate structures identified"
✅ SPECIFIC: "Three Special Purpose Vehicles (SPVs) formed in BVI/Cayman/Seychelles within 30-day period, all sharing registered agent at Trident Trust, collectively received $12.5M with no apparent business purpose"

❌ VAGUE: "Unusual transaction patterns detected"
✅ SPECIFIC: "Wire transfer of $8.5M routed: Cyprus → Latvia → UK → Cayman in 48 hours, with intermediate stops at known high-risk correspondent banks = classic layering technique"

❌ VAGUE: "Possible sanctions exposure"
✅ SPECIFIC: "ABC Trading Ltd is 68% beneficially owned by Oleg Deripaska (OFAC SDN listed April 6, 2018), triggering OFAC 50% Rule - entity should be treated as blocked"

Your reports have directly informed:
- DOJ criminal prosecutions and consent decrees
- OFAC enforcement actions and civil penalties
- Bank de-risking and customer exit decisions
- Congressional testimony on systemic vulnerabilities
- Interpol Red Notices and asset freezing orders

**Understand the Context - Tailor Your Analysis:**
Your analysis serves different purposes depending on the use case:

📋 **Due Diligence / KYC/AML** (onboarding decision):
- Risk rating: ACCEPT / ENHANCED DUE DILIGENCE / REJECT
- Recommended monitoring: Transaction thresholds, periodic reviews, source of funds verification
- Risk mitigation: EDD measures, senior management approval, exit strategy

💼 **M&A / Investment / Commercial Due Diligence**:
- Deal recommendation: PROCEED / PROCEED WITH CONDITIONS / ABORT
- Risk quantification: Potential financial exposure, reputational risk, regulatory penalties
- Mitigation: Reps & warranties, indemnities, escrow provisions, post-closing audits

🚨 **Internal Investigation / Compliance Review**:
- SAR filing determination: FILE SAR / MONITOR / CLEAR
- Customer relationship: MAINTAIN / ENHANCED MONITORING / EXIT
- Remediation: Account restrictions, transaction limits, documentation requirements

⚖️ **Law Enforcement / Regulatory Support**:
- Criminal liability: Statutes violated (18 USC 1956, 31 USC 5318(k), 50 USC 1705)
- Evidence quality: Sufficient for prosecution / needs strengthening / insufficient
- Next investigative steps: Subpoenas, search warrants, witness interviews

${investigationContext}

**READ THE INVESTIGATION CONTEXT ABOVE and determine which use case applies. Adjust your tone, risk assessment, and recommendations accordingly.**

For example:
- If context mentions "client onboarding" → Focus on KYC/AML risk rating and EDD recommendations
- If context mentions "potential investment" → Focus on deal risk and transaction structuring
- If context mentions "suspicious activity" → Focus on SAR filing criteria and regulatory reporting
- If context mentions "prosecution" or "enforcement" → Focus on criminal statutes and evidence sufficiency

Apply your synthesis methodology with PRECISION:
1. **Risk calibration**: State EXACT risk level with SPECIFIC justification (calibrate based on use case)
2. **Use case-appropriate analysis**:
 - For onboarding: "ENHANCED DUE DILIGENCE required: beneficial ownership verification, source of funds documentation"
 - For prosecution: "Potential violations: 18 USC 1956(a)(1) - money laundering, OFAC violations under 50 USC 1705"
3. **Context-aware recommendations**: Match recommendations to the decision being made
4. **Strategic intelligence**: CONNECT to broader patterns relevant to stakeholder concerns
5. **Actionable next steps**: BE SPECIFIC to the use case

Remember: Be thorough, precise, definitive, and confident. NO VAGUE LANGUAGE. Context-aware precision is key.

PIPELINE RESULTS:
- Documents Analyzed: ${pipelineData.documentSummaries.length}
- Entities Identified: ${pipelineData.resolvedEntities.length}
- Relationships Mapped: ${pipelineData.relationships.length}
- Timeline Events: ${pipelineData.timeline.length}
- Patterns Found: ${pipelineData.patterns.length}
- Typologies Identified: ${pipelineData.typologies.length}
- Hypotheses Generated: ${pipelineData.hypotheses.length}

RESOLVED ENTITIES:
${JSON.stringify(pipelineData.resolvedEntities, null, 2)}

TYPOLOGIES:
${JSON.stringify(pipelineData.typologies, null, 2)}

HYPOTHESES:
${JSON.stringify(pipelineData.hypotheses, null, 2)}

Generate executive summary and consolidate findings.

Respond with JSON matching the full investigation format:
{
 "executiveSummary": {
 "overview": "Comprehensive 4-6 sentence executive summary",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "primaryConcerns": ["Concern 1", "Concern 2", "Concern 3"],
 "recommendedActions": ["Action 1", "Action 2", "Action 3"]
 },
 "entities": [
 {
 "id": "entity_id_from_resolvedEntities",
 "name": "Entity Name",
 "type": "PERSON|ORGANIZATION",
 "role": "Their role in the case",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "sanctionStatus": "CLEAR|MATCH|POTENTIAL_MATCH",
 "mentions": [{"docId": 1, "context": "How mentioned"}],
 "connections": ["connected_entity_id_1", "connected_entity_id_2"]
 }
 ],
 "note": "ONLY include PERSON and ORGANIZATION types in entities array. Do NOT include ACCOUNT, ADDRESS, DATE, or AMOUNT - those are used internally for analysis but are not displayed entities.",
 "typologies": ${JSON.stringify(pipelineData.typologies)},
 "timeline": ${JSON.stringify(pipelineData.timeline)},
 "hypotheses": ${JSON.stringify(pipelineData.hypotheses)},
 "patterns": ${JSON.stringify(pipelineData.patterns)},
 "contradictions": ${JSON.stringify(pipelineData.contradictions || [])},
 "relationships": ${JSON.stringify(pipelineData.relationships)},
 "nextSteps": [
 {
 "priority": "HIGH|MEDIUM|LOW",
 "action": "Specific action requiring human intervention",
 "rationale": "Why this is important",
 "expectedOutcome": "What we hope to learn"
 }
 ]
}

IMPORTANT: DO NOT suggest database screening, sanctions checking, or ownership verification as next steps - these are automated. Only suggest: document requests, interviews, legal consultations, subpoenas, registry filings, transaction analysis.`;

 updateProgress(8); // Synthesizing findings in progress
 const finalAnalysis = await callClaudeWithRetry(step8Prompt);

 updateProgress(9); // Finalizing analysis
 return finalAnalysis;
 };

 // Post-process analysis to add automated investigations
 const postProcessAnalysis = async (parsed) => {
 const automatedFindings = [];

 // Filter entities to ONLY include PERSON and ORGANIZATION types
 // ACCOUNT, ADDRESS, DATE, AMOUNT are used internally but not displayed
 if (parsed.entities) {
 parsed.entities = parsed.entities.filter(e =>
 e.type === 'PERSON' || e.type === 'ORGANIZATION'
 );
 }

 // For each sanctioned or high-risk entity, automatically investigate their network
 if (parsed.entities) {
 for (const entity of parsed.entities) {
 if (entity.sanctionStatus === 'MATCH' || entity.riskLevel === 'CRITICAL' || entity.riskLevel === 'HIGH') {

 // For individuals: Map their complete ownership portfolio
 if (entity.type === 'PERSON' && entity.ownedCompanies && entity.ownedCompanies.length > 0) {
 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'OWNERSHIP_MAPPING',
 title: `Complete Ownership Portfolio Mapped for ${entity.name}`,
 description: `Automated investigation identified ${entity.ownedCompanies.length} entities in ownership portfolio. ${entity.ownedCompanies.filter(c => c.ownershipPercent >= 50).length} entities with controlling interest (≥50%).`,
 data: {
 totalEntities: entity.ownedCompanies.length,
 controllingInterest: entity.ownedCompanies.filter(c => c.ownershipPercent >= 50).length,
 significantInterest: entity.ownedCompanies.filter(c => c.ownershipPercent >= 25 && c.ownershipPercent < 50).length,
 companies: entity.ownedCompanies.map(c => ({
 name: c.company,
 ownership: c.ownershipPercent,
 type: c.ownershipType
 }))
 }
 });
 }

 // For organizations: Map beneficial ownership structure
 if (entity.type === 'ORGANIZATION' && entity.beneficialOwners && entity.beneficialOwners.length > 0) {
 const sanctionedOwners = entity.beneficialOwners.filter(o => o.sanctionStatus === 'SANCTIONED');

 if (sanctionedOwners.length > 0) {
 const totalSanctionedOwnership = sanctionedOwners.reduce((sum, o) => sum + (o.percent || 0), 0);

 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'SANCTIONED_OWNERSHIP',
 title: `Sanctioned Beneficial Ownership Detected in ${entity.name}`,
 description: `${sanctionedOwners.length} sanctioned individual(s) identified in beneficial ownership structure. Total sanctioned ownership: ${totalSanctionedOwnership.toFixed(1)}%.`,
 data: {
 aggregateOwnership: totalSanctionedOwnership.toFixed(1),
 sanctionedOwners: sanctionedOwners.map(o => ({
 name: o.name,
 ownership: o.percent,
 lists: o.sanctionDetails?.lists || (o.sanctionDetails ? [o.sanctionDetails] : ['Sanctioned']),
 details: o.sanctionDetails
 })),
 ofacRuleTriggered: totalSanctionedOwnership >= 50
 }
 });
 }
 }

 // For organizations: Map corporate network
 if (entity.type === 'ORGANIZATION' && entity.corporateNetwork && entity.corporateNetwork.length > 0) {
 const highRiskRelated = entity.corporateNetwork.filter(r => r.sanctionExposure === 'DIRECT');

 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'CORPORATE_NETWORK',
 title: `Corporate Network Mapped for ${entity.name}`,
 description: `Identified ${entity.corporateNetwork.length} related ${entity.corporateNetwork.length === 1 ? 'entity' : 'entities'} via common ownership. ${highRiskRelated.length > 0 ? `${highRiskRelated.length} with direct sanctions exposure.` : 'No direct sanctions exposure identified.'}`,
 data: {
 totalRelated: entity.corporateNetwork.length,
 directExposure: highRiskRelated.length,
 relatedEntities: entity.corporateNetwork.map(r => ({
 name: r.entity || r.name,
 relationship: r.relationship || 'RELATED',
 commonOwner: r.commonOwner,
 sanctionExposure: r.sanctionExposure || r.exposure || 'NONE'
 }))
 }
 });
 }
 }
 }
 }

 // Add automated findings to the analysis
 if (automatedFindings.length > 0) {
 parsed.automatedInvestigations = automatedFindings;
 }

 return parsed;
 };

 const analyzeEvidence = async () => {
 console.log('analyzeEvidence called', { files: files.length, caseDescription: caseDescription.substring(0, 50) });
 if (files.length === 0 && !caseDescription.trim()) {
   console.log('No files or description, returning early');
   return;
 }

 console.log('Starting analysis...');
 setIsAnalyzing(true);
 setAnalysis(null); // Clear previous analysis

 // Check if this is a screening request
 const isScreening = caseDescription.startsWith('[SCREENING]');
 
 if (isScreening) {
 // Extract the screening subject
 const screeningSubject = caseDescription.replace('[SCREENING]', '').trim();
 
 if (!screeningSubject) {
 setAnalysisError('Please enter a subject to screen');
 setIsAnalyzing(false);
 return;
 }

 const systemPrompt = `You are a KYC screening specialist. Screen individuals and entities against sanctions lists, PEP databases, and adverse media.

HIGH-PROFILE SANCTIONED INDIVIDUALS AND THEIR CORPORATE OWNERSHIP:
- OLEG DERIPASKA (SDN April 2018): Owns EN+ Group (48%), Rusal (48% indirect), Basic Element (100%)
- ALISHER USMANOV (SDN March 2022): Owns USM Holdings (100%), Metalloinvest (49%), MegaFon (15.2%)
- VIKTOR VEKSELBERG (SDN April 2018): Owns Renova Group (100%), Sulzer AG (63.4%), Columbus Nova (beneficial owner)
- ROMAN ABRAMOVICH (EU/UK/Canada March 2022): Owns Evraz (28.6%), Millhouse Capital (100%), formerly Chelsea FC
- GENNADY TIMCHENKO (SDN March 2014): Owns Volga Group (100%), Novatek (23.5%), Sibur (17%)
- ARKADY & BORIS ROTENBERG (SDN March 2014): Own SMP Bank (37.5% each), SGM Group (100%), Stroygazmontazh (51%)
- ALEXEI MORDASHOV (EU February 2022): Owns Severstal (77%), TUI AG (34%), Nordgold (90%)
- VLADIMIR POTANIN (UK June 2022): Owns Norilsk Nickel (34.6%), Interros (100%), Rosa Khutor (50%)
- VLADIMIR PUTIN (EU/UK/Canada/etc. Feb 2022): State control over Gazprom (50%+), Rosneft (50%+), Sberbank (50%+), VTB Bank (60.9%), Transneft (100%)

SANCTIONED ENTITIES: NIOC, IRGC, PDVSA, Rusal, EN+ Group, Gazprombank, Wagner Group, XPCC

OFAC 50% RULE: Entity owned 50%+ aggregate by blocked persons is itself blocked.

CRITICAL FOR OWNERSHIP EXTRACTION: When you identify ANY person in your analysis, you MUST check if they appear in the sanctioned individuals list above and include ALL their owned companies in the entities array. This is essential for complete sanctions risk assessment.

You must respond with a JSON object that will be converted into an investigative case format. Structure:
{
 "executiveSummary": {
 "overview": "Comprehensive 4-6 sentence executive summary providing: (1) Subject identification and business/political context, (2) Exact sanctions/regulatory status with specific designation details (listing dates, programs like 'Executive Order 13662', jurisdictions like OFAC/EU/UK), (3) Key ownership structures, government connections, or PEP status, (4) Material compliance implications and transaction restrictions, (5) Critical risk factors requiring enhanced due diligence or rejection. Write in authoritative, professional tone for senior compliance officers. Include specific regulatory citations and percentages where applicable.",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "primaryConcerns": ["Detailed concern with specific sanctions programs/dates/implications", "Concern with exact ownership percentages or government connections", "Concern with clear legal/compliance consequences"],
 "recommendedActions": ["Specific action with regulatory basis (e.g., 'REJECT transactions under OFAC sanctions', 'ESCALATE for licensing determination', 'PROHIBIT dealings per 50% rule')", "Action with compliance outcome", "Action with documentation requirement"]
 },
 "entities": [
 {
 "id": "e1",
 "name": "subject name",
 "type": "PERSON or ORGANIZATION",
 "role": "Screening Subject",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "riskIndicators": ["sanctions match", "PEP status", etc],
 "citations": ["Screening Results"]
 }
 ],
 "typologies": [
 {
 "id": "t1",
 "name": "Sanctions Exposure" or "PEP Risk" etc,
 "category": "SANCTIONS_EVASION",
 "description": "details",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "indicators": ["specific findings"],
 "redFlags": ["red flags found"]
 }
 ],
 "timeline": [
 {
 "id": "tl1",
 "date": "date if known",
 "event": "sanctions listing, PEP appointment, adverse media event",
 "significance": "why this matters",
 "riskLevel": "HIGH",
 "citations": ["Source"]
 }
 ],
 "patterns": [
 {
 "name": "pattern type",
 "description": "what was found",
 "instances": ["example 1", "example 2"]
 }
 ],
 "nextSteps": [
 {
 "priority": "HIGH|MEDIUM|LOW",
 "action": "recommended action",
 "rationale": "why"
 }
 ]
}

Perform comprehensive screening checking: sanctions lists (OFAC, UN, EU, UK), PEP status, adverse media, and ownership analysis. Return detailed findings.`;

 const userPrompt = `Screen this subject: ${screeningSubject}`;

 try {
 setAnalysisError(null);
 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 8000,
 messages: [
 { role: "user", content: `${systemPrompt}\n\n${userPrompt}` }
 ]
 })
 });

 if (!response.ok) {
 const errorText = await response.text();
 throw new Error(`API error: ${response.status} - ${errorText}`);
 }

 const data = await response.json();
 const text = data.content?.map(item => item.text || "").join("\n") || "";
 
 let jsonStr = text;
 const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
 if (codeBlockMatch) {
 jsonStr = codeBlockMatch[1].trim();
 } else {
 const jsonMatch = text.match(/\{[\s\S]*\}/);
 if (jsonMatch) {
 jsonStr = jsonMatch[0];
 }
 }
 
 if (jsonStr && jsonStr.startsWith('{')) {
 try {
 const parsed = JSON.parse(jsonStr);

 // Auto-generate case name based on analysis if not already set
 if (!caseName || caseName === '') {
 const primaryEntities = parsed.entities?.slice(0, 2).map(e => e.name).join(', ') || 'Unknown';
 const riskLevel = parsed.executiveSummary?.riskLevel || 'UNKNOWN';
 const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
 const autoName = `${primaryEntities} - ${riskLevel} - ${dateStr}`;
 setCaseName(autoName);
 }

 setAnalysis(parsed);
 setActiveTab('overview');
 saveCase(parsed);
 } catch (parseError) {
 console.error('JSON parse error:', parseError);
 setAnalysisError(`Error parsing screening results: ${parseError.message}`);
 }
 } else {
 setAnalysisError('No structured results returned from screening.');
 }
 } catch (error) {
 console.error('Screening error:', error);
 setAnalysisError(`Error during screening: ${error.message}`);
 } finally {
 setIsAnalyzing(false);
 }
 
 return;
 }

 // OTHERWISE PROCEED WITH NORMAL INVESTIGATION ANALYSIS

 // CHECK INVESTIGATION MODE - Scout vs Cipher
 if (investigationMode === 'scout') {
 // SCOUT MODE: Lightweight screening - focus on entity extraction and risk assessment
 try {
 setAnalysisError(null);

 const evidenceContext = files.map((f, idx) => {
 const truncatedContent = f.content.length > 3000
 ? f.content.substring(0, 3000) + '\n\n[... content truncated ...]'
 : f.content;
 return `[DOCUMENT ${idx + 1}: "${f.name}"]\n${truncatedContent}\n[END DOCUMENT ${idx + 1}]`;
 }).join('\n\n');

 const scoutPrompt = `You are a KYC/AML screening specialist performing a lightweight screening analysis.

HIGH-PROFILE SANCTIONED INDIVIDUALS AND THEIR CORPORATE OWNERSHIP:
- OLEG DERIPASKA (SDN April 2018): Owns EN+ Group (48%), Rusal (48% indirect), Basic Element (100%)
- ALISHER USMANOV (SDN March 2022): Owns USM Holdings (100%), Metalloinvest (49%), MegaFon (15.2%)
- VIKTOR VEKSELBERG (SDN April 2018): Owns Renova Group (100%), Sulzer AG (63.4%), Columbus Nova (beneficial owner)
- ROMAN ABRAMOVICH (EU/UK/Canada March 2022): Owns Evraz (28.6%), Millhouse Capital (100%), formerly Chelsea FC
- GENNADY TIMCHENKO (SDN March 2014): Owns Volga Group (100%), Novatek (23.5%), Sibur (17%)
- ARKADY & BORIS ROTENBERG (SDN March 2014): Own SMP Bank (37.5% each), SGM Group (100%), Stroygazmontazh (51%)
- ALEXEI MORDASHOV (EU February 2022): Owns Severstal (77%), TUI AG (34%), Nordgold (90%)
- VLADIMIR POTANIN (UK June 2022): Owns Norilsk Nickel (34.6%), Interros (100%), Rosa Khutor (50%)
- VLADIMIR PUTIN (EU/UK/Canada/etc. Feb 2022): State control over Gazprom (50%+), Rosneft (50%+), Sberbank (50%+), VTB Bank (60.9%), Transneft (100%)

SANCTIONED ENTITIES: NIOC, IRGC, PDVSA, Rusal, EN+ Group, Gazprombank, Wagner Group, XPCC

OFAC 50% RULE: Entity owned 50%+ aggregate by blocked persons is itself blocked.

CRITICAL FOR OWNERSHIP EXTRACTION: When you identify ANY person in your analysis, you MUST check if they appear in the sanctioned individuals list above and include ALL their owned companies in the entities array. This is essential for complete sanctions risk assessment.

INVESTIGATION CONTEXT:
${caseDescription || 'No context provided'}

DOCUMENTS:
${evidenceContext}

Perform a LIGHTWEIGHT SCREENING focusing on:
1. Analyzing documents - Identify key persons and organizations
2. Screening sanctions - Check against sanctions lists
3. Risk Assessment - Evaluate overall risk level

Respond with JSON:
{
 "executiveSummary": {
 "overview": "2-3 sentence summary of key findings",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "primaryConcerns": ["concern 1", "concern 2", "concern 3"],
 "recommendedActions": ["action 1", "action 2"]
 },
 "entities": [
 {
 "id": "e1",
 "name": "Entity Name",
 "type": "PERSON|ORGANIZATION",
 "role": "role in case",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "riskIndicators": ["indicator 1", "indicator 2"],
 "citations": ["source"]
 }
 ],
 "typologies": [
 {
 "id": "t1",
 "name": "Typology name",
 "category": "SANCTIONS_EVASION|MONEY_LAUNDERING|FRAUD|OTHER",
 "description": "description",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "indicators": ["indicator 1"],
 "redFlags": ["red flag 1"]
 }
 ],
 "nextSteps": [
 {
 "priority": "HIGH|MEDIUM|LOW",
 "action": "recommended action",
 "rationale": "why"
 }
 ]
}

CRITICAL: Return ONLY valid JSON. NO trailing commas. NO comments.`;

 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 8000,
 messages: [
 { role: "user", content: scoutPrompt }
 ]
 })
 });

 if (!response.ok) {
 const errorText = await response.text();
 throw new Error(`API error: ${response.status} - ${errorText}`);
 }

 const data = await response.json();
 const text = data.content?.map(item => item.text || "").join("\n") || "";

 let jsonStr = text;
 const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
 if (codeBlockMatch) {
 jsonStr = codeBlockMatch[1].trim();
 } else {
 const jsonMatch = text.match(/\{[\s\S]*\}/);
 if (jsonMatch) {
 jsonStr = jsonMatch[0];
 }
 }

 if (jsonStr && jsonStr.startsWith('{')) {
 try {
 const parsed = JSON.parse(jsonStr);

 // Auto-generate case name based on analysis if not already set
 if (!caseName || caseName === '') {
 const primaryEntities = parsed.entities?.slice(0, 2).map(e => e.name).join(', ') || 'Unknown';
 const riskLevel = parsed.executiveSummary?.riskLevel || 'UNKNOWN';
 const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
 const autoName = `${primaryEntities} - ${riskLevel} - ${dateStr}`;
 setCaseName(autoName);
 }

 setAnalysis(parsed);
 setActiveTab('overview');
 saveCase(parsed);
 } catch (parseError) {
 console.error('JSON parse error:', parseError);
 setAnalysisError(`Error parsing Scout results: ${parseError.message}`);
 }
 } else {
 setAnalysisError('No structured results returned from Scout screening.');
 }
 } catch (error) {
 console.error('Scout analysis error:', error);
 setAnalysisError(`Scout analysis error: ${error.message}`);
 } finally {
 setIsAnalyzing(false);
 }
 return;
 }

 // CIPHER MODE: Run analysis
 console.log('CIPHER MODE: Starting analysis');

 // Generate initial case name from user input
 let displayCaseName = caseName;
 if (!displayCaseName) {
   if (caseDescription.trim()) {
     // Use first 60 chars of description, cut at word boundary
     const desc = caseDescription.trim();
     displayCaseName = desc.length > 60 ? desc.substring(0, 60).replace(/\s+\S*$/, '...') : desc;
   } else if (files.length > 0) {
     // Use file names
     displayCaseName = files.slice(0, 2).map(f => f.name.replace(/\.[^.]+$/, '')).join(', ');
   } else {
     displayCaseName = 'New Investigation';
   }
 }

 // Start progress tracking
 setBackgroundAnalysis({
   isRunning: true,
   caseId: `case_${Date.now()}`,
   caseName: displayCaseName,
   currentStep: 'Initializing analysis...',
   stepNumber: 1,
   totalSteps: 5,
   progress: 5
 });
 setIsAnalyzing(false); // Hide full-screen loader, show progress card instead

 // Use multi-step pipeline for files with substantial content
 if (files.length > 0 && files.some(f => f.content.length > 500)) {
try {
setAnalysisError(null);

// Progress callback for precise pipeline step updates
const handlePipelineProgress = (progressInfo) => {
  setBackgroundAnalysis(prev => ({
    ...prev,
    currentStep: progressInfo.currentStep + '...',
    stepNumber: progressInfo.stepNumber,
    totalSteps: progressInfo.totalSteps,
    progress: Math.round(progressInfo.progress * 0.85) // Pipeline is 85% of total
  }));
};

const finalAnalysis = await runAnalysisPipeline(files, caseDescription, handlePipelineProgress);

// Update progress: Post-processing
setBackgroundAnalysis(prev => ({
  ...prev,
  currentStep: 'Compiling results...',
  stepNumber: 10,
  progress: 88
}));

// Process the analysis through automated investigation
const enhancedAnalysis = await postProcessAnalysis(finalAnalysis);

// Auto-generate case name based on analysis if not already set
let finalCaseName = caseName;
if (!caseName || caseName === '') {
const primaryEntities = enhancedAnalysis.entities?.slice(0, 2).map(e => e.name).join(', ') || 'Unknown';
const riskLevel = enhancedAnalysis.executiveSummary?.riskLevel || 'UNKNOWN';
const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
finalCaseName = `${primaryEntities} - ${riskLevel} - ${dateStr}`;
setCaseName(finalCaseName);
}

// Update progress: Finalizing
setBackgroundAnalysis(prev => ({
  ...prev,
  caseName: finalCaseName,
  currentStep: 'Preparing report...',
  stepNumber: 11,
  progress: 95
}));

await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause before showing results

// Complete - show "Results ready" and store pending analysis
setBackgroundAnalysis(prev => ({
  ...prev,
  isRunning: false,
  isComplete: true,
  progress: 100,
  currentStep: 'Analysis complete',
  pendingAnalysis: enhancedAnalysis
}));

// Save the case but don't navigate yet - user will click to view
saveCase(enhancedAnalysis);

return; // Pipeline succeeded, exit

} catch (error) {
 console.error('Pipeline analysis error:', error);
 setAnalysisError(`Analysis pipeline error: ${error.message}. Falling back to single-step analysis.`);
 // Fall through to traditional analysis below
 }
 }

 // Text-only or fallback: Single-step analysis
 console.log('Starting single-step analysis...');

 // Update progress for single-step
 setBackgroundAnalysis(prev => ({
   ...prev,
   currentStep: 'Analyzing content...',
   stepNumber: 1,
   progress: 20
 }));

 // Traditional single-step analysis
 // Limit content to avoid rate limits - truncate each file to ~3000 chars
 const evidenceContext = files.map((f, idx) => {
 const truncatedContent = f.content.length > 3000
 ? f.content.substring(0, 3000) + '\n\n[... content truncated to fit rate limits ...]'
 : f.content;
 return `[DOCUMENT ${idx + 1}: "${f.name}"]\n${truncatedContent}\n[END DOCUMENT ${idx + 1}]`;
 }).join('\n\n');

 const systemPrompt = `You are Marlowe, a senior financial crimes investigator with 15 years of experience at FinCEN, OFAC, and major financial institutions. You've worked hundreds of money laundering, sanctions evasion, and fraud cases. You have deep expertise equivalent to Certified Fraud Examiners (CFE) and ACAMS-certified professionals.

HIGH-PROFILE SANCTIONED INDIVIDUALS AND THEIR CORPORATE OWNERSHIP:
- OLEG DERIPASKA (SDN April 2018): Owns EN+ Group (48%), Rusal (48% indirect), Basic Element (100%)
- ALISHER USMANOV (SDN March 2022): Owns USM Holdings (100%), Metalloinvest (49%), MegaFon (15.2%)
- VIKTOR VEKSELBERG (SDN April 2018): Owns Renova Group (100%), Sulzer AG (63.4%), Columbus Nova (beneficial owner)
- ROMAN ABRAMOVICH (EU/UK/Canada March 2022): Owns Evraz (28.6%), Millhouse Capital (100%), formerly Chelsea FC
- GENNADY TIMCHENKO (SDN March 2014): Owns Volga Group (100%), Novatek (23.5%), Sibur (17%)
- ARKADY & BORIS ROTENBERG (SDN March 2014): Own SMP Bank (37.5% each), SGM Group (100%), Stroygazmontazh (51%)
- ALEXEI MORDASHOV (EU February 2022): Owns Severstal (77%), TUI AG (34%), Nordgold (90%)
- VLADIMIR POTANIN (UK June 2022): Owns Norilsk Nickel (34.6%), Interros (100%), Rosa Khutor (50%)
- VLADIMIR PUTIN (EU/UK/Canada/etc. Feb 2022): State control over Gazprom (50%+), Rosneft (50%+), Sberbank (50%+), VTB Bank (60.9%), Transneft (100%)

SANCTIONED ENTITIES: NIOC, IRGC, PDVSA, Rusal, EN+ Group, Gazprombank, Wagner Group, XPCC

OFAC 50% RULE: Entity owned 50%+ aggregate by blocked persons is itself blocked.

CRITICAL FOR OWNERSHIP EXTRACTION: When you identify ANY person in your analysis, you MUST check if they appear in the sanctioned individuals list above and include ALL their owned companies in the entities array. This is essential for complete sanctions risk assessment.

ENTITY EXTRACTION - THINK LIKE AN INVESTIGATOR:

When extracting entities, watch for RED FLAGS:
- Nominee directors (people who appear on many unrelated companies)
- Layered ownership structures (Company A owns B owns C owns D)
- Jurisdictional arbitrage (entities in secrecy havens: BVI, Cayman, Panama, Cyprus, UAE, Malta)
- Mismatched profiles (small company, huge transactions)
- Recently formed entities involved in large deals
- PO Box addresses, registered agent addresses
- Bearer shares or undisclosed ownership

ENTITY RELATIONSHIPS THAT MATTER:
- Beneficial ownership (direct and indirect)
- Control relationships (board seats, signing authority)
- Family connections (often used to obscure ownership)
- Business relationships (supplier, customer, partner)
- Financial relationships (lender, guarantor, investor)

For each entity, ask yourself:
- Why would this entity exist in this structure?
- What legitimate purpose does it serve?
- What could it be hiding?

SPECIALIZED INVESTIGATION FRAMEWORKS:

SANCTIONS EVASION INDICATORS:
- 50% Rule exposure (aggregate ownership by blocked persons)
- Front companies (recently formed, minimal operations, high transaction volume)
- Falsified shipping documents
- Transshipment through third countries
- Use of shell companies to obscure blocked party involvement
- Changes in ownership structure timed with sanctions announcements
- Multiple intermediaries in supply chain
- Discrepancies in stated end-users

MONEY LAUNDERING INDICATORS (Three stages: Placement, Layering, Integration):
- Structuring patterns (transactions just below reporting thresholds)
- Round-dollar transactions (unusual in legitimate business)
- Rapid movement of funds (in and out quickly)
- Funnel accounts (many sources, one destination)
- Trade-based laundering (over/under invoicing)
- Commingling of funds
- Use of cash-intensive businesses
- Complex wire transfer patterns obscuring origin/destination

FRAUD INVESTIGATION INDICATORS:
- Document inconsistencies (dates, signatures, amounts)
- Phantom entities (exist on paper only)
- Conflicts of interest (same person on both sides of transaction)
- Unusual timing patterns
- Missing documentation
- Altered financial statements
- Invoice manipulation
- Shell company involvement

Your role is to analyze evidence and produce structured investigative findings. You must:
1. Extract ALL entities (people, organizations, accounts, addresses, dates, amounts)
2. Screen entities against sanctions lists and identify PEP/adverse media exposure
3. Analyze beneficial ownership structures and apply OFAC 50% Rule
4. For EACH person/individual entity, identify ALL companies they own or control (with ownership percentages)
5. For EACH company entity, identify ALL beneficial owners (with ownership percentages)
6. Build a chronological timeline of events
7. Identify patterns, red flags, and potential violations
8. Generate and score multiple hypotheses
9. Find contradictions and gaps in the evidence
10. ALWAYS cite specific documents for every claim using [Doc X] format

CRITICAL: When you identify a person as a subject of investigation, you MUST also extract and include:
- All companies they own (direct ownership)
- All companies they control (indirect ownership through other entities)
- All companies where they have beneficial ownership
- Ownership percentages for each relationship
This information is essential for sanctions screening and OFAC 50% Rule analysis.

Red Flag Indicators to Watch:
- Structuring (transactions just below reporting thresholds)
- Round-dollar transactions
- Rapid movement of funds
- Shell company indicators
- Beneficial ownership opacity
- Unusual transaction patterns
- Geographic risk factors (high-risk jurisdictions)
- Timing anomalies
- Inconsistent documentation
- Sanctions evasion indicators
- PEP involvement
- Complex corporate structures hiding ownership`;

 const investigationContext = caseDescription.trim() 
 ? `INVESTIGATION CONTEXT:\n${caseDescription}\n\n`
 : '';

 const userPrompt = files.length > 0
 ? `${investigationContext}Analyze the following evidence materials and produce an investigative analysis.

${evidenceContext}

Respond with a JSON object in this exact structure:
{
 "executiveSummary": {
 "overview": "Comprehensive 4-6 sentence executive summary providing: (1) Entity identification and business context, (2) Specific sanctions/regulatory status with exact designation details (dates, programs, jurisdictions), (3) Key ownership/control structures and government connections, (4) Material compliance implications and restrictions, (5) Critical risk factors requiring enhanced due diligence. Write in professional, authoritative tone suitable for senior compliance officers and legal counsel. Include specific regulatory citations (e.g., 'Executive Order 13662', 'OFAC SDN list', 'EU Regulation 833/2014').",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "primaryConcerns": ["Detailed concern with specific regulatory/sanctions implications", "Concern with exact percentages/amounts/dates", "Concern with legal/compliance consequences"],
 "recommendedActions": ["Specific, actionable recommendation with regulatory basis (e.g., 'REJECT all debt financing >90 days under EO 13662', 'ESCALATE to OFAC for licensing determination', 'PROHIBIT transactions pending SAR filing')", "Action with clear compliance outcome", "Action with documentation requirement"]
 },
 "entities": [
 {
 "id": "e1",
 "name": "Entity Name",
 "type": "PERSON|ORGANIZATION|ACCOUNT",
 "role": "Brief role in the case",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "sanctionStatus": "CLEAR|POTENTIAL_MATCH|SANCTIONED",
 "pepStatus": false,
 "beneficialOwners": [{"name": "owner", "percent": 0, "sanctionStatus": "CLEAR|SANCTIONED"}],
 "ownedCompanies": [{"company": "Company Name", "ownershipPercent": 0, "ownershipType": "DIRECT|INDIRECT|BENEFICIAL"}],
 "riskIndicators": ["specific risk indicators with [Doc X] citations"],
 "citations": ["Doc 1", "Doc 2"]
 }
 ],
 "typologies": [
 {
 "id": "t1",
 "name": "Specific financial crime typology name",
 "category": "MONEY_LAUNDERING|FRAUD|SANCTIONS_EVASION|CORRUPTION|TERRORIST_FINANCING|OTHER",
 "description": "Comprehensive 2-3 sentence description of the typology and how it manifests in this case",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "indicators": ["Detailed indicator 1 with evidence [Doc X]", "Detailed indicator 2 [Doc Y]", "Indicator 3 [Doc Z]"],
 "redFlags": ["Specific red flag 1", "Specific red flag 2", "Red flag 3"],
 "entitiesInvolved": ["e1", "e2"],
 "regulatoryRelevance": "Which laws/regulations are implicated (BSA, OFAC, EU Sanctions, etc.)"
 }
 ],
 "timeline": [
 {
 "id": "tl1",
 "date": "YYYY-MM-DD or description",
 "event": "What happened with specific details",
 "significance": "Why this event matters to the investigation",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "citations": ["Doc 1"]
 }
 ],
 "hypotheses": [
 {
 "id": "h1",
 "title": "Clear, specific hypothesis statement",
 "description": "Detailed 2-3 sentence explanation of the hypothesis and its implications",
 "confidence": 0.75,
 "supportingEvidence": ["Specific supporting evidence point 1 with detailed citation [Doc X]", "Evidence point 2 [Doc Y]", "Evidence point 3 [Doc Z]"],
 "contradictingEvidence": ["Contradicting evidence 1 [Doc X]", "Counter-evidence 2 [Doc Y]"],
 "investigativeGaps": ["Specific data/evidence needed to prove/disprove this hypothesis", "Gap 2", "Gap 3"]
 }
 ],
 "patterns": [
 {
 "name": "Pattern name",
 "description": "Detailed description of the pattern and its significance",
 "instances": ["Specific instance 1 [Doc X]", "Instance 2 [Doc Y]", "Instance 3 [Doc Z]"]
 }
 ],
 "contradictions": [
 {
 "description": "Specific contradiction in the evidence",
 "source1": "First piece of conflicting evidence [Doc X]",
 "source2": "Second piece of conflicting evidence [Doc Y]",
 "resolution": "Possible explanation or what's needed to resolve"
 }
 ],
 "relationships": [
 {
 "entity1": "e1",
 "entity2": "e2",
 "relationshipType": "ownership|transaction|employment|family|beneficial_owner|other",
 "description": "Nature of the relationship",
 "citations": ["Doc 1"]
 }
 ],
 "nextSteps": [
 {
 "priority": "HIGH|MEDIUM|LOW",
 "action": "Specific, actionable investigation step (e.g., 'Subpoena bank records for account XXX', 'Interview witness Y', 'Request corporate registry search for Company Z')",
 "rationale": "Detailed explanation of why this step is important and what it will help determine",
 "expectedOutcome": "What you hope to learn or confirm"
 }
 ]
}

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON, nothing else
- Start with { and end with }
- Be thorough: Include 3-8 items per major array (entities, typologies, hypotheses, nextSteps)
- TYPOLOGIES: Identify ALL relevant financial crime typologies with comprehensive indicators and red flags
- HYPOTHESES: Generate multiple competing hypotheses (3-5) with detailed supporting/contradicting evidence
- NEXT STEPS: Provide 5-10 specific, actionable investigative steps prioritized by importance
- **IMPORTANT**: DO NOT suggest database screening, sanctions list checking, or ownership verification as next steps - Marlowe has ALREADY completed comprehensive sanctions screening, beneficial ownership analysis, and ownership network mapping automatically. Only suggest actions requiring human intervention: document requests, interviews, legal consultations, subpoenas, registry filings, banking records, transaction analysis, etc.
- Every claim must cite specific documents using [Doc X] format
- Descriptions should be detailed and professional - this is for serious financial crime investigations
- Include regulatory context and compliance implications`
 : `${investigationContext}Based on the investigation description provided, create an initial investigative framework with preliminary analysis.

Since no evidence documents have been uploaded yet, focus on:
1. Identifying key entities mentioned or implied
2. Potential typologies based on the description
3. Recommended investigative steps
4. Data collection priorities

Respond with a JSON object in this exact structure:
{
 "executiveSummary": {
 "overview": "Summary of the investigation scope",
 "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
 "primaryConcerns": ["based on description"],
 "recommendedActions": ["next steps"]
 },
 "entities": [
 {
 "id": "e1",
 "name": "Entity name from description",
 "type": "PERSON|ORGANIZATION|ACCOUNT",
 "role": "Role in investigation",
 "riskLevel": "UNKNOWN",
 "sanctionStatus": "UNKNOWN",
 "pepStatus": false,
 "beneficialOwners": [],
 "riskIndicators": [],
 "citations": ["Investigation Scope"]
 }
 ],
 "typologies": [
 {
 "id": "t1",
 "name": "Potential typology",
 "category": "MONEY_LAUNDERING|FRAUD|SANCTIONS_EVASION|OTHER",
 "description": "Based on description",
 "riskLevel": "MEDIUM",
 "indicators": ["indicators to look for"],
 "redFlags": ["red flags to watch"]
 }
 ],
 "timeline": [],
 "hypotheses": [
 {
 "id": "h1",
 "title": "Initial hypothesis",
 "description": "Based on description",
 "confidence": 0.5,
 "supportingEvidence": ["investigation scope"],
 "contradictingEvidence": [],
 "investigativeGaps": ["evidence needed"]
 }
 ],
 "patterns": [],
 "nextSteps": [
 {
 "priority": "HIGH",
 "action": "Evidence collection priority",
 "rationale": "Why this is important"
 }
 ]
}`;

 try {
 setAnalysisError(null);

 // Update progress before API call
 setBackgroundAnalysis(prev => ({
   ...prev,
   currentStep: 'Analyzing with AI...',
   stepNumber: 1,
   progress: 30
 }));

 // Reduce token limit to avoid rate limits
 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 4000,
 messages: [
 { role: "user", content: `${systemPrompt}\n\n${userPrompt}` }
 ]
 })
 });

 if (!response.ok) {
 const errorText = await response.text();

 // Check for rate limit error
 if (response.status === 429) {
 throw new Error(`Rate limit exceeded. Please wait a moment and try again. The analysis uses many tokens - try uploading fewer documents or smaller files.`);
 }

 throw new Error(`API error: ${response.status} - ${errorText}`);
 }

 const data = await response.json();
 const text = data.content?.map(item => item.text || "").join("\n") || "";

 // Update progress - processing response
 setBackgroundAnalysis(prev => ({
   ...prev,
   currentStep: 'Processing results...',
   stepNumber: 2,
   progress: 66
 }));

 // Extract JSON from response - handle markdown code blocks
 let jsonStr = text;

 // Remove markdown code blocks if present
 const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
 if (codeBlockMatch) {
 jsonStr = codeBlockMatch[1].trim();
 } else {
 // Try to find raw JSON object
 const jsonMatch = text.match(/\{[\s\S]*\}/);
 if (jsonMatch) {
 jsonStr = jsonMatch[0];
 }
 }

 if (jsonStr && jsonStr.startsWith('{')) {
 // Clean common JSON syntax errors before parsing
 try {
 // Remove comments (shouldn't be in JSON but sometimes appear)
 jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
 jsonStr = jsonStr.replace(/\/\/.*/g, '');

 // Remove trailing commas in objects and arrays (common LLM error)
 // This handles cases like: {"key": "value",} and ["item1", "item2",]
 jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

 // Fix multiple consecutive commas
 jsonStr = jsonStr.replace(/,(\s*,)+/g, ',');

 // Remove commas before closing brackets that might have been missed
 jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');

 const parsed = JSON.parse(jsonStr);

 // Enrich entities with REAL sanctions screening data
 try {
 if (parsed.entities && parsed.entities.length > 0) {
 const enrichedEntities = await Promise.all(parsed.entities.map(async (entity) => {
 try {
 // Screen entity against real sanctions database
 const sanctionsResponse = await fetch(`${API_BASE}/api/screen-sanctions`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: entity.name,
 type: entity.type === 'PERSON' ? 'INDIVIDUAL' : 'ENTITY'
 })
 });

 const sanctionsData = await sanctionsResponse.json();

 // Update entity with real sanctions status
 entity.sanctionStatus = sanctionsData.status;

 // Get ownership network for this entity (bidirectional)
 const networkResponse = await fetch(`${API_BASE}/api/ownership-network`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: entity.name,
 type: entity.type === 'PERSON' ? 'INDIVIDUAL' : 'ENTITY'
 })
 });
 const ownershipNetwork = await networkResponse.json();

 // For PERSON entities, add owned companies
 if (entity.type === 'PERSON' && ownershipNetwork.ownedCompanies) {
 entity.ownedCompanies = ownershipNetwork.ownedCompanies;
 }

 // For ORGANIZATION entities, add corporate network
 if (entity.type === 'ORGANIZATION' && ownershipNetwork.corporateStructure) {
 entity.corporateNetwork = ownershipNetwork.corporateStructure;
 }

 // If it's an organization, get real ownership analysis
 if (entity.type === 'ORGANIZATION') {
 const ownershipResponse = await fetch(`${API_BASE}/api/analyze-ownership`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ entityName: entity.name })
 });

 const ownershipData = await ownershipResponse.json();

 // Add real beneficial owners
 if (ownershipData.beneficialOwners && ownershipData.beneficialOwners.length > 0) {
 entity.beneficialOwners = ownershipData.beneficialOwners.map(owner => ({
 name: owner.name,
 percent: owner.ownershipPercent,
 sanctionStatus: owner.sanctionStatus
 }));
 }

 // Add OFAC 50% rule info to risk indicators
 if (ownershipData.fiftyPercentRuleTriggered) {
 entity.riskIndicators = entity.riskIndicators || [];
 entity.riskIndicators.unshift(`BLOCKED under OFAC 50% Rule: ${ownershipData.aggregateBlockedOwnership}% owned by sanctioned persons`);
 entity.riskLevel = 'CRITICAL';
 } else if (ownershipData.aggregateBlockedOwnership > 0) {
 entity.riskIndicators = entity.riskIndicators || [];
 entity.riskIndicators.unshift(`${ownershipData.aggregateBlockedOwnership}% aggregate ownership by sanctioned persons`);
 }
 }

 // Add sanctions match details to risk indicators
 if (sanctionsData.status === 'MATCH' && sanctionsData.match) {
 entity.riskIndicators = entity.riskIndicators || [];
 entity.riskIndicators.unshift(`SANCTIONED: ${sanctionsData.match.lists.join(', ')} - Listed ${sanctionsData.match.listingDate}`);
 entity.riskLevel = 'CRITICAL';
 } else if (sanctionsData.status === 'POTENTIAL_MATCH') {
 entity.riskIndicators = entity.riskIndicators || [];
 entity.riskIndicators.unshift(`Potential sanctions match - requires further review`);
 }

 return entity;
 } catch (screenError) {
 console.error(`Error screening entity ${entity.name}:`, screenError);
 return entity; // Return original entity if screening fails
 }
 }));

 parsed.entities = enrichedEntities;
 }
 } catch (enrichError) {
 console.error('Entity enrichment error:', enrichError);
 // Continue with original entities if enrichment fails
 }

 // AUTO-INVESTIGATION: Generate automated investigative findings
 try {
 const automatedFindings = [];

 // For each sanctioned or high-risk entity, automatically investigate their network
 if (parsed.entities) {
 for (const entity of parsed.entities) {
 // If entity is sanctioned or high risk, add automated investigation findings
 if (entity.sanctionStatus === 'MATCH' || entity.riskLevel === 'CRITICAL' || entity.riskLevel === 'HIGH') {

 // For individuals: Map their complete ownership portfolio
 if (entity.type === 'PERSON' && entity.ownedCompanies && entity.ownedCompanies.length > 0) {
 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'OWNERSHIP_MAPPING',
 title: `Complete Ownership Portfolio Mapped for ${entity.name}`,
 description: `Automated investigation identified ${entity.ownedCompanies.length} entities in ownership portfolio. ${entity.ownedCompanies.filter(c => c.ownershipPercent >= 50).length} entities with controlling interest (≥50%).`,
 data: {
 totalEntities: entity.ownedCompanies.length,
 controllingInterest: entity.ownedCompanies.filter(c => c.ownershipPercent >= 50).length,
 significantInterest: entity.ownedCompanies.filter(c => c.ownershipPercent >= 25 && c.ownershipPercent < 50).length,
 companies: entity.ownedCompanies.map(c => ({
 name: c.company,
 ownership: c.ownershipPercent,
 type: c.ownershipType
 }))
 }
 });
 }

 // For organizations: Map beneficial ownership structure
 if (entity.type === 'ORGANIZATION' && entity.beneficialOwners && entity.beneficialOwners.length > 0) {
 const sanctionedOwners = entity.beneficialOwners.filter(o => o.sanctionStatus === 'SANCTIONED');

 if (sanctionedOwners.length > 0) {
 const totalSanctionedOwnership = sanctionedOwners.reduce((sum, o) => sum + (o.percent || 0), 0);

 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'SANCTIONED_OWNERSHIP',
 title: `Sanctioned Beneficial Ownership Detected in ${entity.name}`,
 description: `${sanctionedOwners.length} sanctioned individual(s) identified in beneficial ownership structure. Total sanctioned ownership: ${totalSanctionedOwnership.toFixed(1)}%.`,
 data: {
 aggregateOwnership: totalSanctionedOwnership.toFixed(1),
 sanctionedOwners: sanctionedOwners.map(o => ({
 name: o.name,
 ownership: o.percent,
 lists: o.sanctionDetails?.lists || (o.sanctionDetails ? [o.sanctionDetails] : ['Sanctioned']),
 details: o.sanctionDetails
 })),
 ofacRuleTriggered: totalSanctionedOwnership >= 50
 }
 });
 }
 }

 // For organizations: Map corporate network via common ownership
 if (entity.type === 'ORGANIZATION' && entity.corporateNetwork && entity.corporateNetwork.length > 0) {
 const highRiskRelated = entity.corporateNetwork.filter(r => r.sanctionExposure === 'DIRECT');

 automatedFindings.push({
 entityId: entity.id,
 entityName: entity.name,
 findingType: 'CORPORATE_NETWORK',
 title: `Corporate Network Mapped for ${entity.name}`,
 description: `Identified ${entity.corporateNetwork.length} related ${entity.corporateNetwork.length === 1 ? 'entity' : 'entities'} via common ownership. ${highRiskRelated.length > 0 ? `${highRiskRelated.length} with direct sanctions exposure.` : 'No direct sanctions exposure identified.'}`,
 data: {
 totalRelated: entity.corporateNetwork.length,
 directExposure: highRiskRelated.length,
 relatedEntities: entity.corporateNetwork.map(r => ({
 name: r.entity || r.name,
 relationship: r.relationship || 'RELATED',
 commonOwner: r.commonOwner,
 sanctionExposure: r.sanctionExposure || r.exposure || 'NONE'
 }))
 }
 });
 }
 }
 }
 }

 // Add automated findings to the analysis
 if (automatedFindings.length > 0) {
 parsed.automatedInvestigations = automatedFindings;

 // Enhance next steps with specific automated investigation results
 parsed.nextSteps = parsed.nextSteps || [];

 // Generate detailed investigative next steps based on automated findings
 const enhancedSteps = [];

 for (const finding of automatedFindings) {
 if (finding.findingType === 'OWNERSHIP_MAPPING') {
 // Generate detailed steps for each owned entity
 enhancedSteps.push({
 priority: 'CRITICAL',
 action: `Request complete corporate registry filings, articles of incorporation, and beneficial ownership documentation for all ${finding.data.totalEntities} entities in ${finding.entityName}'s portfolio: ${finding.data.companies.map(c => c.name).join(', ')}`,
 rationale: `Automated screening identified ${finding.data.controllingInterest} entities with controlling interest (≥50%) and ${finding.data.significantInterest} with significant interest (25-49%). Corporate documentation will reveal nominee arrangements, shell company indicators, beneficial ownership chains, and timing of ownership transfers relative to sanctions events.`,
 expectedOutcome: `Complete corporate structure mapped with formation dates, registered agents, shareholder registries, and board composition. Identifies potential asset concealment mechanisms and sanctions evasion structures.`
 });

 if (finding.data.controllingInterest > 0) {
 enhancedSteps.push({
 priority: 'HIGH',
 action: `Collect banking records, financial statements, and transaction data for all entities where ${finding.entityName} holds controlling interest: ${finding.data.companies.filter(c => c.ownership >= 50).map(c => c.name).join(', ')}`,
 rationale: `Controlling ownership (≥50%) suggests operational control and decision-making authority. Banking records will reveal fund flows between entities, suspicious transaction patterns, SWIFT message trails, correspondent banking relationships, and whether institutions have filed SARs/STRs.`,
 expectedOutcome: `Transaction patterns mapped, counterparties identified, fund flow diagrams created. Reveals layering schemes, trade-based money laundering indicators, and connections to high-risk jurisdictions or entities.`
 });
 }

 enhancedSteps.push({
 priority: 'HIGH',
 action: `Analyze timing of all ownership transfers, corporate restructuring, or asset movements involving ${finding.entityName}'s portfolio entities relative to sanctions designation dates and geopolitical events`,
 rationale: `Temporal patterns often reveal reactive measures to avoid sanctions. Need to determine if assets were transferred to nominees, restructured through additional layers, or moved to non-sanctioned jurisdictions following designation announcements.`,
 expectedOutcome: `Timeline of ownership changes mapped against sanctions events. Identifies pre-emptive asset protection, post-designation evasion attempts, or suspicious timing that suggests foreknowledge of sanctions action.`
 });
 }

 if (finding.findingType === 'SANCTIONED_OWNERSHIP') {
 const totalSanctionedOwnership = finding.data.sanctionedOwners.reduce((sum, o) => sum + (o.ownership || 0), 0);

 enhancedSteps.push({
 priority: 'CRITICAL',
 action: `Obtain current sanctions designation documentation from OFAC, EU, UK OFSI, UN, and other relevant jurisdictions for all beneficial owners: ${finding.data.sanctionedOwners.map(o => o.name).join(', ')}`,
 rationale: `${finding.data.ofacRuleTriggered ? `OFAC 50% Rule is triggered - ${finding.entityName} is itself blocked due to ${totalSanctionedOwnership.toFixed(1)}% aggregate ownership by sanctioned persons.` : `Sanctioned beneficial ownership of ${totalSanctionedOwnership.toFixed(1)}% creates significant sanctions risk and reputational exposure.`} Need complete designation details, asset freeze provisions, licensing procedures, and enforcement actions.`,
 expectedOutcome: `Legal framework established for ${finding.entityName}. Determines whether entity is prohibited, requires OFAC license, or falls under general license provisions. Identifies enforcement risk and compliance obligations.`
 });

 enhancedSteps.push({
 priority: 'CRITICAL',
 action: `Request historical beneficial ownership records, shareholder registries, and corporate governance documents for ${finding.entityName} covering period from 2 years before to present date`,
 rationale: `Beneficial ownership structures may have changed to evade sanctions. Historical records reveal whether sanctioned individuals divested holdings post-designation, transferred shares to nominees or family members, or obscured ownership through additional corporate layers. Critical for understanding evasion schemes.`,
 expectedOutcome: `Ownership timeline mapped showing changes in beneficial ownership structure. Identifies potential nominee arrangements, divestment timing relative to sanctions events, and shell company indicators.`
 });

 enhancedSteps.push({
 priority: 'HIGH',
 action: `Map complete family networks, known associates, and potential nominees for all sanctioned beneficial owners; cross-reference against asset ownership records and corporate directorships`,
 rationale: `Sanctioned individuals commonly use family members, close associates, and professional nominees to maintain control while obscuring beneficial ownership. Need to identify potential strawmen and verify whether ownership transfers represent genuine divestment or continued control.`,
 expectedOutcome: `Network diagram showing relationships between sanctioned individuals and potential nominees. Identifies shell company patterns, nominee director arrangements, and beneficial ownership chains designed to evade sanctions.`
 });
 }

 if (finding.findingType === 'CORPORATE_NETWORK') {
 enhancedSteps.push({
 priority: 'HIGH',
 action: `Request corporate registry filings, financial statements, and transactional data for all related entities in corporate network: ${finding.data.relatedEntities.map(r => r.entity).join(', ')}`,
 rationale: `Corporate network of ${finding.data.totalRelated} related entities via common ownership suggests integrated business operations. ${finding.data.directExposure > 0 ? `${finding.data.directExposure} entities have direct sanctions exposure requiring immediate investigation.` : ''} Inter-company transactions, shared infrastructure, and operational integration may indicate evasion structures.`,
 expectedOutcome: `Complete subsidiary map with ownership percentages, operational relationships, shared management, common bank accounts, and inter-company transaction flows. Reveals consolidated enterprise structure and control mechanisms.`
 });

 if (finding.data.directExposure > 0) {
 enhancedSteps.push({
 priority: 'CRITICAL',
 action: `Analyze all inter-company transactions, fund transfers, and commercial relationships between ${finding.entityName} and entities with direct sanctions exposure`,
 rationale: `Direct sanctions exposure in related entities creates compliance risk for the entire corporate network. Need to determine if sanctioned entities are providing financing, conducting transactions as intermediaries, or facilitating sanctions evasion through the corporate structure.`,
 expectedOutcome: `Transaction flows mapped showing fund movements between entities. Identifies potential sanctions violations, prohibited transactions, and whether non-sanctioned entities are serving as conduits for sanctioned parties.`
 });
 }
 }
 }

 // Filter out any AI-generated steps that Marlowe has already done automatically
 const filteredAISteps = (parsed.nextSteps || []).filter(step => {
 const action = step.action.toLowerCase();
 // Remove steps about screening databases, checking sanctions lists, or verifying status
 // These are all done automatically by Marlowe
 return !(
 action.includes('sanctions database') ||
 (action.includes('screen') && (action.includes('sanctions') || action.includes('database'))) ||
 action.includes('verify sanctions') ||
 action.includes('check sanctions') ||
 action.includes('monitor sanctions') ||
 action.includes('ofac screening') ||
 action.includes('sanctions list') ||
 (action.includes('verify current') && action.includes('status'))
 );
 });

 // Add enhanced steps to beginning of filtered next steps array
 parsed.nextSteps = [...enhancedSteps, ...filteredAISteps];
 }
 } catch (autoInvestError) {
 console.error('Automated investigation error:', autoInvestError);
 // Continue even if automated investigation fails
 }

 // Update progress: Building timeline
 setBackgroundAnalysis(prev => ({
   ...prev,
   currentStep: 'Building timeline...',
   stepNumber: 2,
   progress: 50
 }));

 await new Promise(resolve => setTimeout(resolve, 200));

 // Update progress: Generating hypotheses
 setBackgroundAnalysis(prev => ({
   ...prev,
   currentStep: 'Generating hypotheses...',
   stepNumber: 3,
   progress: 70
 }));

 await new Promise(resolve => setTimeout(resolve, 200));

 // Auto-generate case name based on analysis if not already set
 let finalCaseName = caseName;
 if (!caseName || caseName === '') {
 const primaryEntities = parsed.entities?.slice(0, 2).map(e => e.name).join(', ') || 'Unknown';
 const riskLevel = parsed.executiveSummary?.riskLevel || 'UNKNOWN';
 const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
 finalCaseName = `${primaryEntities} - ${riskLevel} - ${dateStr}`;
 setCaseName(finalCaseName);
 }

 // Update progress: Finalizing
 setBackgroundAnalysis(prev => ({
   ...prev,
   caseName: finalCaseName,
   currentStep: 'Finalizing analysis...',
   stepNumber: 4,
   progress: 90
 }));

 await new Promise(resolve => setTimeout(resolve, 300));

 // Complete - show "Results ready" and store pending analysis
 setBackgroundAnalysis(prev => ({
   ...prev,
   isRunning: false,
   isComplete: true,
   progress: 100,
   currentStep: 'Analysis complete',
   pendingAnalysis: parsed
 }));

 // Save the case but don't navigate yet - user will click to view
 saveCase(parsed);
 } catch (parseError) {
 console.error('JSON parse error:', parseError);
 console.error('First 1000 chars of JSON:', jsonStr.substring(0, 1000));
 console.error('Last 500 chars of JSON:', jsonStr.substring(Math.max(0, jsonStr.length - 500)));

 // Try to identify the problematic location
 const errorMatch = parseError.message.match(/position (\d+)/);
 if (errorMatch) {
 const position = parseInt(errorMatch[1]);
 const contextStart = Math.max(0, position - 100);
 const contextEnd = Math.min(jsonStr.length, position + 100);
 console.error('Context around error position:', jsonStr.substring(contextStart, contextEnd));
 }

 setAnalysisError(`Error parsing analysis results. ${parseError.message}. Please try again or simplify your investigation scope.`);
 
 }
 } else {
 console.error('No JSON found in response:', text.substring(0, 500));
 setAnalysisError('No structured results returned. The AI did not return valid JSON.');
 
 }
 } catch (error) {
 console.error('Analysis error:', error);
 setAnalysisError(`Error connecting to analysis service: ${error.message}`);
 
 } finally {
setIsAnalyzing(false);
}
};

 const getRiskColor = (level) => {
 switch (level?.toUpperCase()) {
 case 'CRITICAL': return 'bg-red-600 text-white';
 case 'HIGH': return 'bg-rose-500 text-white';
 case 'MEDIUM': return 'bg-amber-500 text-black';
 case 'LOW': return 'bg-emerald-500 text-white';
 default: return 'bg-gray-500 text-white';
 }
 };

 const getRiskBorder = (level) => {
 switch (level?.toUpperCase()) {
 case 'CRITICAL': return 'border-red-600';
 case 'HIGH': return 'border-rose-500';
 case 'MEDIUM': return 'border-amber-500';
 case 'LOW': return 'border-emerald-500';
 default: return 'border-gray-500';
 }
 };

 // Scroll chat to bottom when new messages arrive
 useEffect(() => {
 if (chatEndRef.current) {
 chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
 }
 }, [chatMessages]);

 // Chat with Marlowe about the case
 const sendChatMessage = async () => {
 if (!chatInput.trim() || isChatLoading) return;

 const userMessage = chatInput.trim();
 setChatInput('');
 setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
 setIsChatLoading(true);

 // Build context from evidence and analysis
 const evidenceContext = files.map((f, idx) => 
 `[DOCUMENT ${idx + 1}: "${f.name}"]\n${f.content}\n[END DOCUMENT ${idx + 1}]`
 ).join('\n\n');

 const analysisContext = analysis ? JSON.stringify(analysis, null, 2) : 'No analysis available yet.';

 const conversationHistory = chatMessages.map(msg => ({
 role: msg.role,
 content: msg.content
 }));

 const systemPrompt = `You are Marlowe, an expert AI investigative analyst. You have analyzed a case and are now answering follow-up questions from the investigator.

You have access to:
1. The original evidence documents
2. Your previous analysis of the case

Always be specific and cite documents when making claims (e.g., [Doc 1], [Doc 2]).
Be concise but thorough. If you don't know something or it's not in the evidence, say so.
Think like a seasoned investigator - look for connections, inconsistencies, and implications.

EVIDENCE DOCUMENTS:
${evidenceContext}

YOUR PREVIOUS ANALYSIS:
${analysisContext}`;

 try {
 const response = await fetch(`${API_BASE}/api/messages`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "claude-sonnet-4-20250514",
 max_tokens: 2000,
 messages: [
 ...conversationHistory,
 { role: "user", content: `${systemPrompt}\n\nUser question: ${userMessage}` }
 ]
 })
 });

 if (!response.ok) {
 throw new Error(`API error: ${response.status}`);
 }

 const data = await response.json();
 const assistantMessage = data.content?.map(item => item.text || "").join("\n") || "I couldn't process that request.";
 
 setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
 } catch (error) {
 console.error('Chat error:', error);
 setChatMessages(prev => [...prev, { 
 role: 'assistant', 
 content: "I encountered an error processing your question. Please try again." 
 }]);
 } finally {
 setIsChatLoading(false);
 }
 };

 const handleChatKeyPress = (e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 sendChatMessage();
 }
 };

 return (
 <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`} style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
 {/* Import fonts */}
 <style>{`
 @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
 
 .mono {  font-family: 'JetBrains Mono', monospace; }
 
 .grid-bg {
 background-image: 
 radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.08) 1px, transparent 1px);
 background-size: 24px 24px;
 }
 
 .glow-cyan {
 box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2);
 }

 .glow-amber {
 box-shadow: 0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.15);
 }

 .glow-red {
 box-shadow: 0 0 20px rgba(244, 63, 94, 0.4), 0 0 40px rgba(244, 63, 94, 0.2);
 }
 
 .glass-card {
 background: rgba(15, 23, 42, 0.7);
 backdrop-filter: blur(20px) saturate(180%);
 border: 1px solid rgba(6, 182, 212, 0.2);
 }
 
 .glass-strong {
 background: rgba(255, 255, 255, 0.95);
 backdrop-filter: blur(24px) saturate(200%);
 border: 1px solid rgba(6, 182, 212, 0.2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
 }
 
 .gradient-border {
 position: relative;
 background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1));
 border: 1px solid transparent;
 }
 
 .gradient-border::before {
 content: '';
 position: absolute;
 inset: 0;
 border-radius: inherit;
 padding: 1px;
 background: linear-gradient(135deg, rgba(6, 182, 212, 0.5), rgba(59, 130, 246, 0.5));
 -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
 -webkit-mask-composite: xor;
 mask-composite: exclude;
 pointer-events: none;
 }
 
 .scan-line {
 background: linear-gradient(
 transparent 0%,
 rgba(6, 182, 212, 0.05) 50%,
 transparent 100%
 );
 animation: scan 8s ease-in-out infinite;
 }
 
 @keyframes scan {
 0%, 100% { transform: translateY(-100%); opacity: 0; }
 50% { transform: translateY(100%); opacity: 1; }
 }
 
 .pulse-ring {
 animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
 }
 
 @keyframes pulse-ring {
 0%, 100% { transform: scale(1); opacity: 0.5; }
 50% { transform: scale(1.05); opacity: 0.3; }
 }
 
 .fade-in {
 animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
 }
 
 @keyframes fadeIn {
 from { opacity: 0; transform: translateY(24px); }
 to { opacity: 1; transform: translateY(0); }
 }
 
 .slide-in {
 animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
 }
 
 @keyframes slideIn {
 from { opacity: 0; transform: translateX(-24px); }
 to { opacity: 1; transform: translateX(0); }
 }
 
 .confidence-bar {
 background: linear-gradient(90deg, 
 #10b981 0%, 
 #3b82f6 33%,
 #f59e0b 66%, 
 #ef4444 100%
 );
 }
 
 .shimmer {
 position: relative;
 overflow: hidden;
 }
 
 .shimmer::before {
 content: '';
 position: absolute;
 inset: 0;
 background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent);
 animation: shimmer 2.5s infinite;
 }
 
 @keyframes shimmer {
 0% { transform: translateX(-100%); }
 100% { transform: translateX(100%); }
 }
 
 .animate-fadeInOut {
            animation: fadeInOut 7s ease-in-out forwards;
 }

 @keyframes fadeInOut {
 0% { opacity: 0; }
 10% { opacity: 1; }
 90% { opacity: 1; }
 100% { opacity: 0; }
 }

 @keyframes slideUp {
 0% { opacity: 0; transform: translateY(20px); }
 100% { opacity: 1; transform: translateY(0); }
 }

 .animate-slideUp {
 animation: slideUp 0.3s ease-out forwards;
 }
 `}</style>

 {/* Modern background effects */}
 <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
 <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
 <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
 <div className="grid-bg absolute inset-0 opacity-60" />
 </div>


 <main className="max-w-full mx-auto p-6 relative z-10">


 {/* Scout Page */}
 {currentPage === 'kycScreening' && (
 <div className="fade-in max-w-6xl mx-auto pt-16">
 
 {/* KYC Landing - Choose Action */}
 {kycPage === 'landing' && (
 <div>
 <div className="mb-8 text-center">
 <h2 className="text-2xl font-bold tracking-tight leading-tight mb-2">Scout</h2>
 <p className="text-base text-gray-600 leading-relaxed">Sanctions, PEP, and adverse media screening</p>
 </div>

 <div className="grid md:grid-cols-3 gap-4">
 {/* New Search */}
 <button
 onClick={() => setKycPage('newSearch')}
 className="group bg-white border-2 border-gray-300 hover:border-emerald-500 rounded-xl p-8 text-left transition-all"
 >
 <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/30">
 <Search className="w-6 h-6 text-emerald-500" />
 </div>
 <h3 className="text-lg font-semibold leading-tight mb-2">New Search</h3>
 <p className="text-base text-gray-600 leading-relaxed">Screen an individual or entity against global watchlists</p>
 </button>

 {/* Case History */}
 <button
 onClick={() => setKycPage('history')}
 className="group bg-white border-2 border-gray-300 hover:border-amber-500 rounded-xl p-8 text-left transition-all relative"
 >
 <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-500/30">
 <History className="w-6 h-6 text-amber-500" />
 </div>
 <h3 className="text-lg font-semibold leading-tight mb-2">Case History</h3>
 <p className="text-base text-gray-600 leading-relaxed">View previous screenings and download reports</p>
 {kycHistory.length > 0 && (
 <span className="absolute top-4 right-4 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold tracking-wide text-gray-900">
 {kycHistory.length}
 </span>
 )}
 </button>

 {/* Projects */}
 <button
 onClick={() => setKycPage('projects')}
 className="group bg-white border-2 border-gray-300 hover:border-purple-500 rounded-xl p-8 text-left transition-all relative"
 >
 <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30">
 <FolderPlus className="w-6 h-6 text-purple-500" />
 </div>
 <h3 className="text-lg font-semibold leading-tight mb-2">Projects</h3>
 <p className="text-base text-gray-600 leading-relaxed">Organize screenings by client, deal, or review</p>
 {kycProjects.length > 0 && (
 <span className="absolute top-4 right-4 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold tracking-wide text-gray-900">
 {kycProjects.length}
 </span>
 )}
 </button>
 </div>

 {/* Quick Stats */}
 <div className="mt-8 grid grid-cols-3 gap-4">
 <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
 <p className="text-2xl font-bold tracking-tight leading-tight">{kycHistory.length}</p>
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider">Total Screenings</p>
 </div>
 <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
 <p className="text-2xl font-bold tracking-tight text-rose-4 leading-tight00">
 {kycHistory.filter(h => h.result.overallRisk === 'HIGH' || h.result.overallRisk === 'CRITICAL').length}
 </p>
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider">High Risk Hits</p>
 </div>
 <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
 <p className="text-2xl font-bold tracking-tight leading-tight">{kycProjects.length}</p>
 <p className="text-xs text-gray-500 tracking-wide mono">Active Projects</p>
 </div>
 </div>
 </div>
 )}

 {/* KYC History Page */}
 {kycPage === 'history' && (
 <div>
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <button onClick={() => setKycPage('landing')} className="p-2 hover:bg-gray-100 rounded-lg">
 <ArrowLeft className="w-5 h-5 text-gray-600" />
 </button>
 <div>
 <h2 className="text-2xl font-bold tracking-tight leading-tight">Case History</h2>
 <p className="text-sm text-gray-600 leading-relaxed">{kycHistory.length} screening{kycHistory.length !== 1 ? 's' : ''} on record</p>
 </div>
 </div>
 <button
 onClick={() => setKycPage('newSearch')}
 className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold tracking-wide px-4 py-2 rounded-xl"
 >
 <Plus className="w-4 h-4" />
 New Search
 </button>
 </div>

 {kycHistory.length === 0 ? (
 <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
 <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <h3 className="text-lg font-semibold leading-tight mb-2">No Screenings Yet</h3>
 <p className="text-base text-gray-600 leading-relaxed mb-4">Run your first KYC screening to see results here</p>
 <button
 onClick={() => setKycPage('newSearch')}
 className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold tracking-wide px-4 py-2 rounded-xl"
 >
 <Search className="w-4 h-4" />
 Start Screening
 </button>
 </div>
 ) : (
 <div className="space-y-3">
 {kycHistory.map((item) => (
 <div
 key={item.id}
 className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-8 transition-all"
 >
 <div className="flex items-center gap-4">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
 item.result.overallRisk === 'LOW' || item.result.overallRisk === 'CLEAR' ? 'bg-emerald-50 border border-emerald-200' :
 item.result.overallRisk === 'MEDIUM' ? 'bg-amber-50 border border-amber-200' :
 'bg-rose-50 border border-rose-200'
 }`}>
 {item.type === 'individual' ? (
 <UserSearch className={`w-6 h-6 ${
 item.result.overallRisk === 'LOW' || item.result.overallRisk === 'CLEAR' ? 'text-emerald-500' :
 item.result.overallRisk === 'MEDIUM' ? 'text-amber-500' :
 'text-rose-500'
 }`} />
 ) : (
 <Building2 className={`w-6 h-6 ${
 item.result.overallRisk === 'LOW' || item.result.overallRisk === 'CLEAR' ? 'text-emerald-500' :
 item.result.overallRisk === 'MEDIUM' ? 'text-amber-500' :
 'text-rose-500'
 }`} />
 )}
 </div>
 
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <p className="font-semibold tracking-wide truncate">{item.query}</p>
 <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide shrink-0 ${getRiskColor(item.result.overallRisk)}`}>
 {item.result.overallRisk}
 </span>
 </div>
 <div className="flex items-center gap-3 text-xs text-gray-500">
 <span className="mono tracking-wide">{new Date(item.timestamp).toLocaleString()}</span>
 {item.clientRef && <span>Ref: {item.clientRef}</span>}
 {item.country && <span>{item.country}</span>}
 {/* Show which projects this is in */}
 {kycProjects.filter(p => p.screenings.includes(item.id)).map(p => (
 <span key={p.id} className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-600 rounded">
 {p.name}
 </span>
 ))}
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* Assign to Project */}
 <div className="relative">
 <button
 onClick={() => setAssigningToProject(assigningToProject === item.id ? null : item.id)}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 title="Add to Project"
 >
 <Tag className="w-4 h-4 text-gray-500" />
 </button>
 {assigningToProject === item.id && (
 <div className="absolute right-0 top-full mt-2 w-48 bg-gray-100 border border-gray-300 rounded-lg shadow-xl z-10 p-2">
 <p className="text-xs text-gray-500 px-2 mb-2">Add to project:</p>
 {kycProjects.length === 0 ? (
 <p className="text-xs text-gray-600 px-2">No projects yet</p>
 ) : (
 kycProjects.map(p => (
 <button
 key={p.id}
 onClick={() => addToProject(item.id, p.id)}
 className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${
 p.screenings.includes(item.id) ? 'text-purple-600' : 'text-gray-700'
 }`}
 >
 {p.name} {p.screenings.includes(item.id) && '✓'}
 </button>
 ))
 )}
 </div>
 )}
 </div>
 
 {/* Download PDF */}
 <button
 onClick={() => generatePdfReport(item)}
 disabled={isGeneratingPdf}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 title="Download Report"
 >
 <Download className="w-4 h-4 text-gray-500" />
 </button>
 
 {/* View Details */}
 <button
 onClick={() => viewHistoryItem(item)}
 className="p-2 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
 title="View Details"
 >
 <Eye className="w-4 h-4 text-emerald-500" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* KYC Projects Page */}
 {kycPage === 'projects' && !selectedProject && (
 <div>
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <button onClick={() => setKycPage('landing')} className="p-2 hover:bg-gray-100 rounded-lg">
 <ArrowLeft className="w-5 h-5 text-gray-600" />
 </button>
 <div>
 <h2 className="text-2xl font-bold tracking-tight leading-tight">Projects</h2>
 <p className="text-base text-gray-600 leading-relaxed">Organize screenings by client, deal, or review</p>
 </div>
 </div>
 </div>

 {/* Create Project Form */}
 <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
 <div className="flex gap-3">
 <input
 type="text"
 value={newProjectName}
 onChange={(e) => setNewProjectName(e.target.value)}
 onKeyPress={(e) => e.key === 'Enter' && createProject()}
 placeholder="New project name (e.g., 'Acme Corp Due Diligence', 'Q1 2024 Client Onboarding')"
 className="flex-1 bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-400"
 />
 <button
 onClick={createProject}
 disabled={!newProjectName.trim()}
 className="bg-purple-500 hover:bg-purple-400 disabled:bg-gray-300 text-white disabled:text-gray-500 font-semibold tracking-wide px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
 >
 <Plus className="w-4 h-4" />
 Create
 </button>
 </div>
 </div>

 {/* Projects List */}
 {kycProjects.length === 0 ? (
 <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
 <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <h3 className="text-lg font-semibold leading-tight mb-2">No Projects Yet</h3>
 <p className="text-base text-gray-600 leading-relaxed">Create a project to organize related screenings together</p>
 </div>
 ) : (
 <div className="space-y-3">
 {kycProjects.map((project) => (
 <div
 key={project.id}
 className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-8 transition-all cursor-pointer group"
 onClick={() => setSelectedProject(project)}
 >
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center">
 <Folder className="w-6 h-6 text-purple-500" />
 </div>
 <div className="flex-1">
 <p className="font-semibold">{project.name}</p>
 <p className="text-sm text-gray-500 leading-relaxed">
 {project.screenings.length} screening{project.screenings.length !== 1 ? 's' : ''} • 
 Created {new Date(project.createdAt).toLocaleDateString()}
 </p>
 </div>
 <button
 onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
 className="p-2 hover:bg-rose-50 border border-rose-200 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
 >
 <Trash2 className="w-4 h-4 text-rose-500" />
 </button>
 <ChevronRight className="w-5 h-5 text-gray-400" />
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Single Project View */}
 {kycPage === 'projects' && selectedProject && (
 <div>
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-gray-100 rounded-lg">
 <ArrowLeft className="w-5 h-5 text-gray-600" />
 </button>
 <div>
 <h2 className="text-xl font-bold tracking-tight leading-tight">{selectedProject.name}</h2>
 <p className="text-sm text-gray-600 leading-relaxed">
 {selectedProject.screenings.length} screening{selectedProject.screenings.length !== 1 ? 's' : ''} in project
 </p>
 </div>
 </div>
 <button
 onClick={() => setKycPage('newSearch')}
 className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold tracking-wide px-4 py-2 rounded-xl"
 >
 <Plus className="w-4 h-4" />
 Add Screening
 </button>
 </div>

 {selectedProject.screenings.length === 0 ? (
 <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
 <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <h3 className="text-lg font-semibold leading-tight mb-2">No Screenings in Project</h3>
 <p className="text-base text-gray-600 leading-relaxed mb-4">Add screenings from Case History or run new searches</p>
 </div>
 ) : (
 <div className="space-y-3">
 {selectedProject.screenings.map(screeningId => {
 const item = kycHistory.find(h => h.id === screeningId);
 if (!item) return null;
 return (
 <div
 key={item.id}
 className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-8 transition-all"
 >
 <div className="flex items-center gap-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
 item.result.overallRisk === 'LOW' ? 'bg-emerald-50 border border-emerald-200' :
 item.result.overallRisk === 'MEDIUM' ? 'bg-amber-50 border border-amber-200' :
 'bg-rose-50 border border-rose-200'
 }`}>
 {item.type === 'individual' ? (
 <UserSearch className={`w-5 h-5 ${
 item.result.overallRisk === 'LOW' ? 'text-emerald-500' :
 item.result.overallRisk === 'MEDIUM' ? 'text-amber-500' :
 'text-rose-500'
 }`} />
 ) : (
 <Building2 className={`w-5 h-5 ${
 item.result.overallRisk === 'LOW' ? 'text-emerald-500' :
 item.result.overallRisk === 'MEDIUM' ? 'text-amber-500' :
 'text-rose-500'
 }`} />
 )}
 </div>
 <div className="flex-1">
 <p className="font-medium tracking-wide">{item.query}</p>
 <p className="text-xs text-gray-500 mono tracking-wide">{new Date(item.timestamp).toLocaleString()}</p>
 </div>
 <span className={`px-2 py-1 rounded text-xs font-bold tracking-wide ${getRiskColor(item.result.overallRisk)}`}>
 {item.result.overallRisk}
 </span>
 <button
 onClick={() => removeFromProject(item.id, selectedProject.id)}
 className="p-2 hover:bg-rose-50 border border-rose-200 rounded-lg"
 title="Remove from project"
 >
 <X className="w-4 h-4 text-rose-500" />
 </button>
 <button
 onClick={() => generatePdfReport(item)}
 className="p-2 hover:bg-gray-100 rounded-lg"
 title="Download Report"
 >
 <Download className="w-4 h-4 text-gray-500" />
 </button>
 <button
 onClick={() => viewHistoryItem(item)}
 className="p-2 hover:bg-emerald-50 border border-emerald-200 rounded-lg"
 >
 <Eye className="w-4 h-4 text-emerald-500" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/* New Search Page */}
 {kycPage === 'newSearch' && (
 <div>
 <div className="flex items-center gap-3 mb-6">
 <button onClick={() => setKycPage('landing')} className="p-2 hover:bg-gray-100 rounded-lg">
 <ArrowLeft className="w-5 h-5 text-gray-600" />
 </button>
 <div>
 <h2 className="text-2xl font-bold tracking-tight leading-tight">New Screening</h2>
 <p className="text-sm text-gray-600 leading-relaxed">Screen against sanctions, PEP, and adverse media</p>
 </div>
 </div>

 {/* Search Form */}
 <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
 <div className="flex gap-4 mb-6">
 <button
 onClick={() => setKycType('individual')}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium tracking-wide transition-all ${
 kycType === 'individual' 
 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 border border-emerald-500' 
 : 'bg-gray-100 text-gray-600 border border-gray-300 hover:border-gray-400'
 }`}
 >
 <UserSearch className="w-4 h-4" />
 Individual
 </button>
 <button
 onClick={() => setKycType('entity')}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium tracking-wide transition-all ${
 kycType === 'entity' 
 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 border border-emerald-500' 
 : 'bg-gray-100 text-gray-600 border border-gray-300 hover:border-gray-400'
 }`}
 >
 <Building2 className="w-4 h-4" />
 Entity
 </button>
 </div>

 {kycType === 'individual' ? (
 <div className="space-y-4">
 {/* Individual Form */}
 <div className="grid md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="block text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-2">
 Full Name <span className="text-rose-600">*</span>
 </label>
 <input
 type="text"
 value={kycQuery}
 onChange={(e) => setKycQuery(e.target.value)}
 onKeyPress={(e) => e.key === 'Enter' && runKycScreening()}
 placeholder="e.g., Viktor Vekselberg, Alisher Usmanov"
 className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
 />
 </div>
 
 <div>
 <label className="block text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-2">
 Year of Birth <span className="text-gray-400 font-normal">(optional)</span>
 </label>
 <input
 type="text"
 value={kycYearOfBirth}
 onChange={(e) => setKycYearOfBirth(e.target.value.replace(/\D/g, '').slice(0, 4))}
 placeholder="e.g., 1965"
 maxLength={4}
 className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400 mono"
 />
 </div>
 
 <div>
 <label className="block text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-2">
 Country <span className="text-gray-400 font-normal">(optional)</span>
 </label>
 <input
 type="text"
 value={kycCountry}
 onChange={(e) => setKycCountry(e.target.value)}
 placeholder="e.g., Russia, United States"
 className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
 />
 </div>
 
 <div className="md:col-span-2">
 <label className="block text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-2">
 Client Reference <span className="text-gray-400 font-normal">(optional)</span>
 </label>
 <input
 type="text"
 value={kycClientRef}
 onChange={(e) => setKycClientRef(e.target.value)}
 placeholder="Internal ID or reference number"
 className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
 />
 </div>
 </div>
 
 <p className="text-xs text-gray-500">
 Optional fields help reduce false positives by filtering matches that don't align with the subject's age or geographic nexus.
 </p>
 
 <button
 onClick={runKycScreening}
 disabled={!kycQuery.trim() || isScreening}
 className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-300 text-gray-900 disabled:text-gray-500 font-semibold tracking-wide px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
 >
 {isScreening ? (
 <>
 <Loader2 className="w-5 h-5 animate-spin" />
 Screening...
 </>
 ) : (
 <>
 <Search className="w-5 h-5" />
 Screen Individual
 </>
 )}
 </button>
 </div>
 ) : (
 <div className="flex gap-3">
 <input
 type="text"
 value={kycQuery}
 onChange={(e) => setKycQuery(e.target.value)}
 onKeyPress={(e) => e.key === 'Enter' && runKycScreening()}
 placeholder="Enter company name (e.g., Rusal, EN+ Group, PDVSA)"
 className="flex-1 bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
 />
 <button
 onClick={runKycScreening}
 disabled={!kycQuery.trim() || isScreening}
 className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-300 text-gray-900 disabled:text-gray-500 font-semibold tracking-wide px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
 >
 {isScreening ? (
 <Loader2 className="w-5 h-5 animate-spin" />
 ) : (
 <Search className="w-5 h-5" />
 )}
 Screen
 </button>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Results Page */}
 {kycPage === 'results' && kycResults && (
 <div className="fade-in space-y-6">
 {/* Results Header with Actions */}
 <div className="flex items-center justify-between mb-4">
 <button 
 onClick={() => { clearKycResults(); setKycPage('newSearch'); }} 
 className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
 >
 <ArrowLeft className="w-4 h-4" />
 Back to Search
 </button>
 <div className="flex items-center gap-2">
 {/* Add to Project dropdown */}
 <div className="relative">
 <button
 onClick={() => setAssigningToProject(assigningToProject === 'results' ? null : 'results')}
 className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm transition-colors"
 >
 <Tag className="w-4 h-4" />
 Add to Project
 </button>
 {assigningToProject === 'results' && selectedHistoryItem && (
 <div className="absolute right-0 top-full mt-2 w-64 bg-gray-100 border border-gray-300 rounded-xl shadow-xl z-20 p-3">
 <p className="text-xs text-gray-500 mb-2 px-2">Add to project:</p>
 {kycProjects.length === 0 ? (
 <div className="px-2 py-3 text-center">
 <p className="text-sm text-gray-600 leading-relaxed mb-2">No projects yet</p>
 <button
 onClick={() => { setAssigningToProject(null); setKycPage('projects'); }}
 className="text-xs text-purple-600 hover:text-purple-300"
 >
 Create a project →
 </button>
 </div>
 ) : (
 <div className="space-y-1">
 {kycProjects.map(p => {
 const isInProject = p.screenings.includes(selectedHistoryItem.id);
 return (
 <button
 key={p.id}
 onClick={() => {
 if (isInProject) {
 removeFromProject(selectedHistoryItem.id, p.id);
 } else {
 addToProject(selectedHistoryItem.id, p.id);
 }
 }}
 className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${
 isInProject 
 ? 'bg-purple-50 border border-purple-200 text-purple-600' 
 : 'hover:bg-gray-200 text-gray-700'
 }`}
 >
 <span className="flex items-center gap-2">
 <Folder className="w-4 h-4" />
 {p.name}
 </span>
 {isInProject && <Check className="w-4 h-4" />}
 </button>
 );
 })}
 <div className="border-t border-gray-300 mt-2 pt-2">
 <button
 onClick={() => { setAssigningToProject(null); setKycPage('projects'); }}
 className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-600 hover:bg-gray-200 rounded-lg flex items-center gap-2"
 >
 <Plus className="w-4 h-4" />
 Create new project
 </button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 <button
 onClick={() => selectedHistoryItem && generatePdfReport(selectedHistoryItem)}
 disabled={isGeneratingPdf || !selectedHistoryItem}
 className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm transition-colors"
 >
 {isGeneratingPdf ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Download className="w-4 h-4" />
 )}
 Download Report
 </button>
 <button
 onClick={() => { clearKycResults(); setKycPage('newSearch'); }}
 className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-colors"
 >
 <Plus className="w-4 h-4" />
 New Search
 </button>
 </div>
 </div>

 {/* No Risks Identified - Simplified View */}
 {kycResults.noRisksIdentified ? (
 <div className="bg-white border-2 border-emerald-500 rounded-2xl p-8 text-center">
 <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
 <ShieldCheck className="w-10 h-10 text-emerald-500" />
 </div>
 <h3 className="text-2xl font-bold tracking-tight leading-tight text-emerald-600 mb-2 leading-tight">No Risks Identified</h3>
 <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-md mx-auto">
 Screening of <span className="font-semibold tracking-wide text-gray-900">{kycResults.subject?.name}</span> returned no matches against sanctions lists, PEP databases, or adverse media sources.
 </p>
 
 <div className="inline-flex items-center gap-6 bg-gray-100/50 rounded-xl px-6 py-4 mb-6">
 <div className="text-center">
 <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
 <p className="text-xs text-gray-500">Sanctions</p>
 <p className="text-sm font-medium tracking-wide text-emerald-600">Clear</p>
 </div>
 <div className="w-px h-10 bg-gray-200" />
 <div className="text-center">
 <Users className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
 <p className="text-xs text-gray-500">PEP</p>
 <p className="text-sm font-medium tracking-wide text-emerald-600">Clear</p>
 </div>
 <div className="w-px h-10 bg-gray-200" />
 <div className="text-center">
 <Newspaper className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
 <p className="text-xs text-gray-500">Adverse Media</p>
 <p className="text-sm font-medium tracking-wide text-emerald-600">Clear</p>
 </div>
 {kycType === 'entity' && (
 <>
 <div className="w-px h-10 bg-gray-200" />
 <div className="text-center">
 <GitBranch className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
 <p className="text-xs text-gray-500">50% Rule</p>
 <p className="text-sm font-medium tracking-wide text-emerald-600">Clear</p>
 </div>
 </>
 )}
 </div>

 <div className="text-xs text-gray-500 space-y-1">
 <p>Screened: {new Date(selectedHistoryItem?.timestamp).toLocaleString()}</p>
 {kycClientRef && <p>Client Ref: {kycClientRef}</p>}
 {kycCountry && <p>Country: {kycCountry}</p>}
 {kycYearOfBirth && <p>Year of Birth: {kycYearOfBirth}</p>}
 </div>
 </div>
 ) : (
 <>
 {/* Results Header */}
 <div className={`bg-white border-l-4 ${getRiskBorder(kycResults.overallRisk)} rounded-xl p-6`}>
 <div className="flex items-start justify-between mb-4">
 <div>
 <h3 className="text-xl font-bold tracking-tight leading-tight">{kycResults.subject?.name}</h3>
 <p className="text-sm text-gray-600 mono tracking-wide">{kycResults.subject?.type}</p>
 {kycResults.subject?.jurisdiction && (
 <p className="text-sm text-gray-500 mt-1">
 <Globe className="w-3 h-3 inline mr-1" />
 {kycResults.subject.jurisdiction}
 </p>
 )}
 {/* Show screening parameters */}
 <div className="flex flex-wrap gap-2 mt-2">
 {kycClientRef && (
 <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded mono">
 Ref: {kycClientRef}
 </span>
 )}
 {kycYearOfBirth && (
 <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded mono">
 DOB: {kycYearOfBirth}
 </span>
 )}
 {kycCountry && (
 <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded mono">
 {kycCountry}
 </span>
 )}
 </div>
 </div>
 <div className="flex items-center gap-3">
 <span className={`px-4 py-2 rounded-xl text-sm font-bold ${getRiskColor(kycResults.overallRisk)}`}>
 {kycResults.overallRisk} RISK
 </span>
 <button
 onClick={clearKycResults}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <X className="w-5 h-5 text-gray-500" />
 </button>
 </div>
 </div>
 
 {/* Quick Risk Factors */}
 {kycResults.riskFactors && kycResults.riskFactors.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-4">
 {kycResults.riskFactors.map((rf, idx) => (
 <span key={idx} className={`px-2 py-1 rounded text-xs font-medium ${
 rf.severity === 'CRITICAL' ? 'bg-red-600/20 text-red-600' :
 rf.severity === 'HIGH' ? 'bg-rose-50 border border-rose-200 text-rose-600' :
 rf.severity === 'MEDIUM' ? 'bg-amber-50 border border-amber-200 text-amber-600' :
 'bg-gray-200 text-gray-600'
 }`}>
 {rf.factor}
 </span>
 ))}
 </div>
 )}
 </div>

 {/* 50% Rule / Ownership Analysis - PROMINENT PLACEMENT */}
 {kycResults.ownershipAnalysis && (
 <div className={`bg-white border-2 ${
 kycResults.ownershipAnalysis.fiftyPercentRuleTriggered 
 ? 'border-rose-500 bg-rose-500/5' 
 : 'border-gray-200'
 } rounded-xl p-6`}>
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
 kycResults.ownershipAnalysis.fiftyPercentRuleTriggered
 ? 'bg-red-600/20'
 : kycResults.ownershipAnalysis.riskLevel === 'HIGH' ? 'bg-rose-50 border border-rose-200'
 : kycResults.ownershipAnalysis.riskLevel === 'MEDIUM' ? 'bg-amber-50 border border-amber-200'
 : 'bg-emerald-50 border border-emerald-200'
 }`}>
 <GitBranch className={`w-6 h-6 ${
 kycResults.ownershipAnalysis.fiftyPercentRuleTriggered
 ? 'text-red-600'
 : kycResults.ownershipAnalysis.riskLevel === 'HIGH' ? 'text-rose-500'
 : kycResults.ownershipAnalysis.riskLevel === 'MEDIUM' ? 'text-amber-500'
 : 'text-emerald-500'
 }`} />
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-3">
 <h4 className="font-semibold tracking-wide text-lg">OFAC 50% Rule Analysis</h4>
 {kycResults.ownershipAnalysis.fiftyPercentRuleTriggered && (
 <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold tracking-wide rounded-full animate-pulse">
 BLOCKED BY OWNERSHIP
 </span>
 )}
 </div>
 <p className="text-sm text-gray-600 leading-relaxed">{kycResults.ownershipAnalysis.summary}</p>
 </div>
 </div>

 {/* Aggregate Blocked Ownership Meter */}
 {typeof kycResults.ownershipAnalysis.aggregateBlockedOwnership === 'number' && (
 <div className="mb-6 p-5 bg-gray-100/50 rounded-lg">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-medium tracking-wide">Aggregate Blocked Ownership</span>
 <span className={`mono tracking-wide font-bold ${
 kycResults.ownershipAnalysis.aggregateBlockedOwnership >= 50 ? 'text-red-600' :
 kycResults.ownershipAnalysis.aggregateBlockedOwnership >= 25 ? 'text-rose-500' :
 kycResults.ownershipAnalysis.aggregateBlockedOwnership > 0 ? 'text-amber-500' :
 'text-emerald-500'
 }`}>
 {kycResults.ownershipAnalysis.aggregateBlockedOwnership}%
 </span>
 </div>
 <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
 <div
 className={`h-full transition-all duration-500 ${
 kycResults.ownershipAnalysis.aggregateBlockedOwnership >= 50 ? 'bg-red-600' :
 kycResults.ownershipAnalysis.aggregateBlockedOwnership >= 25 ? 'bg-rose-500' :
 kycResults.ownershipAnalysis.aggregateBlockedOwnership > 0 ? 'bg-amber-500' :
 'bg-emerald-500'
 }`}
 style={{ width: `${Math.min(kycResults.ownershipAnalysis.aggregateBlockedOwnership, 100)}%` }}
 />
 </div>
 <div className="flex justify-between mt-1 text-xs text-gray-500">
 <span>0%</span>
 <span className="text-rose-500 font-medium tracking-wide">50% Threshold</span>
 <span>100%</span>
 </div>
 </div>
 )}

 {/* Beneficial Owners */}
 {kycResults.ownershipAnalysis.beneficialOwners && kycResults.ownershipAnalysis.beneficialOwners.length > 0 && (
 <div className="mb-6">
 <h5 className="text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-3 flex items-center gap-2">
 <Users className="w-4 h-4" />
 Beneficial Owners
 </h5>
 <div className="space-y-2">
 {kycResults.ownershipAnalysis.beneficialOwners.map((owner, idx) => (
 <div key={idx} className={`p-5 rounded-lg border ${
 owner.sanctionStatus === 'SANCTIONED' ? 'bg-red-600/10 border-red-600/50' :
 owner.sanctionStatus === 'POTENTIAL_MATCH' ? 'bg-rose-500/10 border-rose-500/50' :
 'bg-gray-100/50 border-gray-300'
 }`}>
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-3">
 <span className="font-medium tracking-wide">{owner.name}</span>
 {owner.pepStatus && (
 <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-600 text-xs rounded">PEP</span>
 )}
 {owner.sanctionStatus === 'SANCTIONED' && (
 <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded font-bold">SANCTIONED</span>
 )}
 </div>
 <span className={`mono tracking-wide font-bold text-lg ${
 owner.sanctionStatus === 'SANCTIONED' ? 'text-rose-500' : 'text-gray-700'
 }`}>
 {owner.ownershipPercent}%
 </span>
 </div>
 <div className="flex items-center gap-4 text-xs text-gray-500">
 <span className="flex items-center gap-1">
 <Share2 className="w-3 h-3" />
 {owner.ownershipType}
 </span>
 {owner.sanctionDetails && (
 <span className="text-rose-600">{owner.sanctionDetails}</span>
 )}
 <span className="text-gray-400">Source: {owner.source}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Owned Companies (for individuals) */}
 {kycResults.ownedCompanies && kycResults.ownedCompanies.length > 0 && (
 <div className="mb-6">
 <h5 className="text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-3 flex items-center gap-2">
 <Building2 className="w-4 h-4" />
 Ownership Portfolio ({kycResults.ownedCompanies.length} {kycResults.ownedCompanies.length === 1 ? 'Company' : 'Companies'})
 </h5>
 <div className="mb-3 p-5 bg-gray-100/50 rounded-lg">
 <div className="grid grid-cols-2 gap-4 text-sm">
 <div>
 <span className="text-gray-500">Total Companies:</span>
 <span className="ml-2 font-bold text-gray-900">{kycResults.ownedCompanies.length}</span>
 </div>
 <div>
 <span className="text-gray-500">High-Risk (≥50%):</span>
 <span className="ml-2 font-bold text-rose-600">
 {kycResults.ownedCompanies.filter(c => c.ownershipPercent >= 50).length}
 </span>
 </div>
 </div>
 </div>
 <div className="space-y-2">
 {kycResults.ownedCompanies.map((company, idx) => (
 <div key={idx} className={`p-5 rounded-lg border ${
 company.ownershipPercent >= 50 ? 'bg-red-600/10 border-red-600/50' :
 company.ownershipPercent >= 25 ? 'bg-rose-500/10 border-rose-500/50' :
 'bg-gray-100/50 border-gray-300'
 }`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="font-medium">{company.company}</span>
 {company.sanctionedOwner && (
 <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded font-bold">SANCTIONED OWNER</span>
 )}
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs px-2 py-0.5 bg-gray-200 rounded mono">{company.ownershipType}</span>
 <span className={`mono tracking-wide font-bold ${
 company.ownershipPercent >= 50 ? 'text-red-600' :
 company.ownershipPercent >= 25 ? 'text-rose-500' :
 'text-gray-700'
 }`}>
 {company.ownershipPercent > 0 ? `${company.ownershipPercent}%` : company.ownershipType}
 </span>
 </div>
 </div>
 {company.ownerDetails && (
 <div className="mt-2 text-xs text-gray-500">
 Sanctioned: {company.ownerDetails.lists.join(', ')} ({company.ownerDetails.listingDate})
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Corporate Structure */}
 {kycResults.ownershipAnalysis && kycResults.ownershipAnalysis.corporateStructure && kycResults.ownershipAnalysis.corporateStructure.length > 0 && (
 <div className="mb-6">
 <h5 className="text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-3 flex items-center gap-2">
 <Building2 className="w-4 h-4" />
 Corporate Structure
 </h5>
 <div className="space-y-2">
 {kycResults.ownershipAnalysis.corporateStructure.map((entity, idx) => (
 <div key={idx} className={`p-5 rounded-lg ${
 entity.sanctionExposure === 'DIRECT' ? 'bg-red-600/10 border border-red-600/30' :
 entity.sanctionExposure === 'INDIRECT' ? 'bg-rose-500/10 border border-rose-500/30' :
 'bg-gray-100/50 border border-gray-300'
 }`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <span className="text-xs px-2 py-0.5 bg-gray-200 rounded mono tracking-wide">{entity.relationship}</span>
 <span className="font-medium tracking-wide">{entity.entity}</span>
 <span className="text-xs text-gray-500">{entity.jurisdiction}</span>
 </div>
 <div className="flex items-center gap-2">
 {entity.ownershipPercent && (
 <span className="mono text-sm tracking-wide">{entity.ownershipPercent}%</span>
 )}
 {entity.sanctionExposure !== 'NONE' && (
 <span className={`text-xs px-2 py-0.5 rounded ${
 entity.sanctionExposure === 'DIRECT' ? 'bg-red-600/20 text-red-600' : 'bg-rose-50 border border-rose-200 text-rose-600'
 }`}>
 {entity.sanctionExposure} EXPOSURE
 </span>
 )}
 </div>
 </div>
 {entity.notes && (
 <p className="text-xs text-gray-500 mt-2">{entity.notes}</p>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Leaks Database Exposure */}
 {kycResults.ownershipAnalysis.leaksExposure && kycResults.ownershipAnalysis.leaksExposure.length > 0 && (
 <div>
 <h5 className="text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-3 flex items-center gap-2">
 <Database className="w-4 h-4" />
 Offshore Leaks Database Matches
 </h5>
 <div className="space-y-2">
 {kycResults.ownershipAnalysis.leaksExposure.map((leak, idx) => (
 <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
 <div className="flex items-center gap-2 mb-1">
 <span className="font-medium tracking-wide text-amber-600">{leak.database}</span>
 <span className="text-xs text-gray-500 mono tracking-wide">{leak.date}</span>
 </div>
 <p className="text-base text-gray-900 leading-relaxed">{leak.finding}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Sanctions */}
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
 kycResults.sanctions?.status === 'CLEAR' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
 }`}>
 {kycResults.sanctions?.status === 'CLEAR' ? (
 <ShieldCheck className="w-5 h-5 text-emerald-500" />
 ) : (
 <ShieldAlert className="w-5 h-5 text-rose-500" />
 )}
 </div>
 <div>
 <h4 className="font-semibold">Direct Screening sanctions</h4>
 <p className={`text-sm ${
 kycResults.sanctions?.status === 'CLEAR' ? 'text-emerald-600' : 'text-rose-600'
 }`}>
 {kycResults.sanctions?.status === 'CLEAR' ? 'No direct matches found' : 
 kycResults.sanctions?.status === 'POTENTIAL_MATCH' ? 'Potential matches found' : 'Direct match found'}
 </p>
 </div>
 </div>
 
 {kycResults.sanctions?.matches && kycResults.sanctions.matches.length > 0 && (
 <div className="space-y-3 mt-4">
 {kycResults.sanctions.matches.map((match, idx) => (
 <div key={idx} className="bg-gray-100/50 rounded-lg p-4">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <Flag className="w-4 h-4 text-rose-500" />
 <span className="font-medium tracking-wide text-rose-600">{match.list}</span>
 </div>
 <span className="mono text-xs tracking-wide bg-rose-50 border border-rose-200 text-rose-600 px-2 py-1 rounded">
 {match.matchScore}% match
 </span>
 </div>
 {match.matchedName && (
 <p className="text-base text-gray-900 leading-relaxed mb-1">Listed as: <span className="font-medium tracking-wide">{match.matchedName}</span></p>
 )}
 <p className="text-sm text-gray-600 leading-relaxed">{match.details}</p>
 {match.listingDate && (
 <p className="text-xs text-gray-500 mt-2">Listed: {match.listingDate}</p>
 )}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* PEP */}
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
 kycResults.pep?.status === 'CLEAR' ? 'bg-emerald-50 border border-emerald-200' : 'bg-purple-50 border border-purple-200'
 }`}>
 <Users className={`w-5 h-5 ${
 kycResults.pep?.status === 'CLEAR' ? 'text-emerald-500' : 'text-purple-500'
 }`} />
 </div>
 <div>
 <h4 className="font-semibold">PEP Status</h4>
 <p className={`text-sm ${
 kycResults.pep?.status === 'CLEAR' ? 'text-emerald-600' : 'text-purple-600'
 }`}>
 {kycResults.pep?.status === 'CLEAR' ? 'Not a PEP' : 'PEP indicators found'}
 </p>
 </div>
 </div>
 
 {kycResults.pep?.matches && kycResults.pep.matches.length > 0 && (
 <div className="space-y-3 mt-4">
 {kycResults.pep.matches.map((match, idx) => (
 <div key={idx} className="bg-gray-100/50 rounded-lg p-4">
 <div className="flex items-center gap-3 mb-2">
 <Globe className="w-4 h-4 text-gray-500" />
 <span className="font-medium tracking-wide">{match.position || match.name}</span>
 <span className={`px-2 py-0.5 rounded text-xs ${getRiskColor(match.riskLevel)}`}>
 {match.riskLevel}
 </span>
 </div>
 <p className="text-sm text-gray-600 leading-relaxed">
 {match.country} • {match.status}
 {match.relationshipToSubject && match.relationshipToSubject !== 'Self' && (
 <span className="text-purple-600"> • {match.relationshipToSubject}</span>
 )}
 </p>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Adverse Media */}
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
 kycResults.adverseMedia?.status === 'CLEAR' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
 }`}>
 <Newspaper className={`w-5 h-5 ${
 kycResults.adverseMedia?.status === 'CLEAR' ? 'text-emerald-500' : 'text-amber-500'
 }`} />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold">Adverse Media</h4>
 <p className={`text-sm ${
 kycResults.adverseMedia?.status === 'CLEAR' ? 'text-emerald-600' : 'text-amber-600'
 }`}>
 {kycResults.adverseMedia?.status === 'CLEAR' ? 'No adverse media found' : 
 `${kycResults.adverseMedia?.totalArticles || kycResults.adverseMedia?.articles?.length || 0} article(s) found`}
 </p>
 </div>
 
 {/* Category breakdown */}
 {kycResults.adverseMedia?.categories && (
 <div className="flex gap-2">
 {Object.entries(kycResults.adverseMedia.categories).map(([cat, count]) => (
 count > 0 && (
 <span key={cat} className="text-xs px-2 py-1 bg-gray-100 rounded mono">
 {cat}: {count}
 </span>
 )
 ))}
 </div>
 )}
 </div>
 
 {kycResults.adverseMedia?.articles && kycResults.adverseMedia.articles.length > 0 && (
 <div className="space-y-3 mt-4">
 {kycResults.adverseMedia.articles.map((article, idx) => (
 <div key={idx} className="bg-gray-100/50 rounded-lg p-4">
 <div className="flex items-start justify-between mb-2">
 <h5 className="font-medium tracking-wide text-amber-600 flex-1">{article.headline}</h5>
 <div className="flex items-center gap-2 shrink-0 ml-2">
 {article.relevance && (
 <span className={`text-xs px-2 py-0.5 rounded ${
 article.relevance === 'HIGH' ? 'bg-rose-50 border border-rose-200 text-rose-600' :
 article.relevance === 'MEDIUM' ? 'bg-amber-50 border border-amber-200 text-amber-600' :
 'bg-gray-200 text-gray-600'
 }`}>
 {article.relevance}
 </span>
 )}
 <span className="text-xs text-gray-500 mono tracking-wide">{article.date}</span>
 </div>
 </div>
 <p className="text-sm text-gray-600 leading-relaxed mb-2">{article.summary}</p>
 <div className="flex items-center gap-3 text-xs text-gray-500">
 <span>{article.source}</span>
 <span className="px-2 py-0.5 bg-gray-200 rounded">{article.category}</span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Regulatory Guidance */}
 {kycResults.regulatoryGuidance && (
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h4 className="font-semibold tracking-wide mb-4 flex items-center gap-2">
 <Scale className="w-5 h-5 text-blue-500" />
 Regulatory Guidance
 </h4>
 <div className="grid md:grid-cols-3 gap-4">
 <div className="bg-gray-100/50 rounded-lg p-4">
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-1">OFAC IMPLICATIONS</p>
 <p className="text-base text-gray-900 leading-relaxed">{kycResults.regulatoryGuidance.ofacImplications}</p>
 </div>
 <div className="bg-gray-100/50 rounded-lg p-4">
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-1">DUE DILIGENCE LEVEL</p>
 <p className={`text-sm font-medium ${
 kycResults.regulatoryGuidance.dueDiligenceRequired === 'EDD' ? 'text-rose-600' :
 kycResults.regulatoryGuidance.dueDiligenceRequired === 'SDD' ? 'text-emerald-600' :
 'text-gray-700'
 }`}>
 {kycResults.regulatoryGuidance.dueDiligenceRequired === 'EDD' ? 'Enhanced Due Diligence' :
 kycResults.regulatoryGuidance.dueDiligenceRequired === 'SDD' ? 'Simplified Due Diligence' :
 'Standard Due Diligence'}
 </p>
 </div>
 <div className="bg-gray-100/50 rounded-lg p-4">
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-1">FILING REQUIREMENTS</p>
 <div className="flex flex-wrap gap-1">
 {kycResults.regulatoryGuidance.filingRequirements?.map((req, idx) => (
 <span key={idx} className="text-xs px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-600 rounded">
 {req}
 </span>
 )) || <span className="text-sm text-gray-600 leading-relaxed">None required</span>}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Recommendations */}
 {kycResults.recommendations && kycResults.recommendations.length > 0 && (
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h4 className="font-semibold tracking-wide mb-4 flex items-center gap-2">
 <Target className="w-5 h-5 text-amber-500" />
 Recommendations
 </h4>
 <div className="space-y-3">
 {kycResults.recommendations.map((rec, idx) => (
 <div key={idx} className={`p-5 rounded-lg border-l-4 ${
 rec.priority === 'HIGH' ? 'border-rose-500 bg-rose-500/5' :
 rec.priority === 'MEDIUM' ? 'border-amber-500 bg-amber-500/5' :
 'border-gray-400 bg-gray-100/50'
 }`}>
 <div className="flex items-center gap-2 mb-1">
 <span className={`text-xs font-bold tracking-wide mono ${
 rec.priority === 'HIGH' ? 'text-rose-600' :
 rec.priority === 'MEDIUM' ? 'text-amber-600' :
 'text-gray-600'
 }`}>
 {rec.priority}
 </span>
 <span className="font-medium tracking-wide text-gray-900">{rec.action}</span>
 </div>
 <p className="text-sm text-gray-600 leading-relaxed">{rec.rationale}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </>
 )}
 </div>
 )}

 {/* Cipher Loading Overlay */}
 {isScreening && (
 <div className="fixed inset-0 bg-gray-50/95 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
 <div className="text-center">
 <div className="relative w-24 h-24 mx-auto mb-6">
 <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping" />
 <div className="absolute inset-2 border-4 border-emerald-500/50 rounded-full animate-pulse" />
 <div className="absolute inset-4 bg-emerald-500 rounded-full flex items-center justify-center">
 <Shield className="w-8 h-8 text-white animate-pulse" />
 </div>
 </div>
 <h3 className="text-xl font-bold tracking-tight mb-2 leading-tight">Screening in Progress</h3>

 <div className="space-y-4 w-full max-w-2xl mx-auto px-4">
 <p className="text-emerald-600 font-medium tracking-wide text-lg">{screeningStep}</p>

 {/* Progress bar */}
 <div className="space-y-2">
 <div className="flex justify-between text-xs text-gray-600">
 <span>Screening Progress</span>
 <span>{screeningProgress.toFixed(0)}% Complete</span>
 </div>
 <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 transition-all duration-500"
 style={{ width: `${screeningProgress}%` }}
 />
 </div>
 </div>

 {/* Pipeline steps */}
 <div className="grid grid-cols-5 gap-2 text-xs mt-8">
 <div className={`p-3 rounded text-center transition-all duration-300 ${screeningProgress >= 15 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-gray-100/50 text-gray-500'}`}>
 <div className="font-medium tracking-wide">1. Sanctions Check</div>
 </div>
 <div className={`p-3 rounded text-center transition-all duration-300 ${screeningProgress >= 35 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-gray-100/50 text-gray-500'}`}>
 <div className="font-medium tracking-wide">2. Ownership Analysis</div>
 </div>
 <div className={`p-3 rounded text-center transition-all duration-300 ${screeningProgress >= 55 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-gray-100/50 text-gray-500'}`}>
 <div className="font-medium tracking-wide">3. Context Building</div>
 </div>
 <div className={`p-3 rounded text-center transition-all duration-300 ${screeningProgress >= 65 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-gray-100/50 text-gray-500'}`}>
 <div className="font-medium tracking-wide">4. AI Risk Analysis</div>
 </div>
 <div className={`p-3 rounded text-center transition-all duration-300 ${screeningProgress >= 90 ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-gray-100/50 text-gray-500'}`}>
 <div className="font-medium tracking-wide">5. Report Generation</div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 </div>
 )}

 {/* Noir Landing Page */}
 {currentPage === 'noirLanding' && (
 <div className="fade-in min-h-screen -mt-24">
 {/* Hero Section - Full viewport height */}
 <div className="min-h-screen flex flex-col justify-center px-6 relative">
 <div className="max-w-4xl mx-auto text-center">
 {/* Marlowe Logo */}
 <div className="mb-8">
 <span
 className="text-5xl md:text-6xl font-bold tracking-tight text-amber-500"
 style={{
 textShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
 }}
 >
 Marlowe
 </span>
 </div>

 {/* Headline */}
 <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 text-gray-900 leading-tight">
 The AI investigator for<br />
 <span className="text-amber-500" style={{textShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'}}>
 financial crime
 </span>
 </h1>

 <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
 Reduce investigation time from hours to minutes
 </p>
 <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
 Close up to 10x more cases per week
 </p>

 {/* CTAs */}
 <div className="flex items-center justify-center">
 <button
 onClick={startNewCase}
 className="group bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20 flex items-center gap-2"
 >
 <span>Launch Marlowe</span>
 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
 </button>
 </div>
 </div>

 {/* Scroll indicator - hides after scrolling */}
 {!hasScrolled && (
 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 animate-bounce transition-opacity duration-500">
 <span className="text-sm font-medium">Learn more</span>
 <ChevronDown className="w-5 h-5" />
 </div>
 )}
 </div>

 {/* Problem Section */}
 <div className="py-20 px-6 bg-white">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="text-4xl font-bold tracking-tight mb-4">Investigative Tech for the AI Age</h2>
 <p className="text-lg text-gray-600">We've automated everything except what matters most</p>
 </div>
 <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
 <p className="text-gray-700 leading-relaxed mb-6">
 Ask any financial crimes analyst to show you their latest case. You'll see browser tabs open to three different screening platforms. A folder of 50 screenshots from corporate registries and social media. Countless spreadsheets of transaction data. A running Google Doc where the analyst is trying to connect everything.
 </p>
 <p className="text-gray-700 leading-relaxed mb-6">
 We have incredible tools for <span className="font-semibold text-gray-900">capturing</span> information. But those tools don't tell investigators what it all <span className="font-semibold text-gray-900">means</span>. The hardest part of investigating—the analysis—is still painstakingly manual. Investigators deserve better.
 </p>
 <div className="bg-white border border-gray-200 rounded-xl p-6">
 <div className="text-center">
 <div className="text-5xl font-bold text-amber-500 mb-2">$16-32B</div>
 <p className="text-gray-600">Annual cost of manual investigative analysis</p>
 <p className="text-sm text-gray-500 mt-2">20-40% of $80B global AML labor spend</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Investigation Pipeline Graphic */}
 <div className="py-20 px-6 bg-gray-100">
 <div className="max-w-5xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="text-4xl font-bold tracking-tight mb-4">The investigation pipeline</h2>
 <p className="text-lg text-gray-600">Marlowe tackles the toughest parts of getting to the truth.</p>
 </div>

 {/* Pipeline Graphic */}
 <div className="relative">
 {/* Connection line */}
 <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-300 via-emerald-300 to-amber-400 -translate-y-1/2 hidden md:block" style={{left: '8%', right: '8%'}} />

 <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
 {/* Already Automated - Collection */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center mb-3 relative z-10">
 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Collection</span>
 </div>

 {/* Already Automated - Processing */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center mb-3 relative z-10">
 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Processing</span>
 </div>

 {/* Already Automated - Basic Analysis */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center mb-3 relative z-10">
 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Basic Analysis</span>
 </div>

 {/* Marlowe - Advanced Analysis */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center mb-3 relative z-10 shadow-lg shadow-amber-500/20">
 <Zap className="w-8 h-8 text-amber-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Advanced Analysis</span>
 </div>

 {/* Marlowe - Synthesis */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center mb-3 relative z-10 shadow-lg shadow-amber-500/20">
 <Zap className="w-8 h-8 text-amber-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Synthesis</span>
 </div>

 {/* Marlowe - Interpretation */}
 <div className="flex flex-col items-center">
 <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center mb-3 relative z-10 shadow-lg shadow-amber-500/20">
 <Zap className="w-8 h-8 text-amber-500" />
 </div>
 <span className="text-sm font-semibold text-gray-900 text-center">Interpretation</span>
 </div>
 </div>
 </div>

 {/* Legend */}
 <div className="flex justify-center gap-8 mt-10">
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded-full bg-emerald-400" />
 <span className="text-sm text-gray-600">Already automated by existing tools</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded-full bg-amber-500" />
 <span className="text-sm text-gray-600">Now automated by Marlowe</span>
 </div>
 </div>
 </div>
 </div>

 {/* How It Works Section */}
 <div className="py-20 px-6 bg-gray-900">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">AI that reasons like an expert investigator</h2>
 </div>
 <div className="grid md:grid-cols-2 gap-8 mb-12">
 <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
 <div className="text-gray-400 text-sm font-semibold mb-3">BEFORE</div>
 <p className="text-gray-300 leading-relaxed mb-4">
 An analyst spends <span className="text-white font-semibold">6-8 hours</span> manually reviewing documents, tracking entities in a spreadsheet, building a timeline by hand, cross-referencing corporate structures, and writing up findings.
 </p>
 <div className="flex items-center gap-2 text-rose-400">
 <div className="w-2 h-2 rounded-full bg-rose-400" />
 <span className="text-sm font-semibold">6-8 hours per case</span>
 </div>
 </div>
 <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-8">
 <div className="text-amber-500 text-sm font-semibold mb-3">WITH MARLOWE</div>
 <p className="text-gray-300 leading-relaxed mb-4">
 Marlowe processes the same documents <span className="text-white font-semibold">in minutes</span> and outputs <span className="text-white font-semibold">3x the conclusions</span> the analyst would've reached. The analyst reviews, asks follow-up questions, and gets straight to judgment calls that require human expertise.
 </p>
 <div className="flex items-center gap-2 text-emerald-400">
 <div className="w-2 h-2 rounded-full bg-emerald-400" />
 <span className="text-sm font-semibold">30 minutes per case</span>
 </div>
 </div>
 </div>
  </div>
 </div>

 {/* Features Section */}
 <div className="py-20 px-6 bg-gray-50">
 <div className="max-w-7xl mx-auto">
 <div className="text-center mb-16">
 <h2 className="text-4xl font-bold tracking-tight mb-4">Two specialized engines</h2>
 <p className="text-lg text-gray-600">Purpose-built AI for compliance and investigations</p>
 </div>

 <div className="grid md:grid-cols-2 gap-6 mb-12">
 {/* Cipher Card */}
 <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/50 transition-all duration-300 group">
 <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-amber-200/50 group-hover:scale-105 transition-transform">
 <Shield className="w-8 h-8 text-amber-500" />
 </div>
 <h3 className="text-2xl font-bold mb-3">Cipher</h3>
 <p className="text-gray-600 mb-6 leading-relaxed">
 Investigation engine that extracts entities, builds timelines, maps relationships, and generates investigative insights based on evidence documents.
 </p>
 <ul className="space-y-3 text-sm text-gray-600">
 <li className="flex items-start gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
 <span>Narrative & Timeline Formation</span>
 </li>
 <li className="flex items-start gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
 <span>Automated Analyzing documents and Ownership Mapping</span>
 </li>
 <li className="flex items-start gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
 <span>Advanced Typology Detection</span>
 </li>
 <li className="flex items-start gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
 <span>Hypothesis & Lead Generation</span>
 </li>
 </ul>
 </div>

 {/* Scout Card */}
 <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/50 transition-all duration-300 group">
 <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-emerald-200/50 group-hover:scale-105 transition-transform">
 <Search className="w-8 h-8 text-emerald-500" />
 </div>
 <h3 className="text-2xl font-bold mb-3">Scout</h3>
 <p className="text-gray-600 mb-6 leading-relaxed">
 Compliance screening engine with comprehensive sanctions, PEP, and adverse media intelligence. Real-time risk assessment for KYC/AML workflows.
 </p>
 <ul className="space-y-3 text-sm text-gray-600">
 <li className="flex items-start gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
 <span>Advanced Adverse Media Analysis</span>
 </li>
 <li className="flex items-start gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
 <span>Global Sanctions Coverage</span>
 </li>
 <li className="flex items-start gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
 <span>PEP Identification and Mapping relationships</span>
 </li>
 <li className="flex items-start gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
 <span>Customer Risk Scoring & Decision Support</span>
 </li>
 </ul>
 </div>
 </div>

 {/* Additional Feature Cards */}
 <div className="grid md:grid-cols-4 gap-6">
 {/* Analyzing documents Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Users className="w-6 h-6 text-blue-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Analyzing documents</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Automatically identify people, companies, and relationships from unstructured documents</p>
 </div>

 {/* Typology Detection Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-purple-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Target className="w-6 h-6 text-purple-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Typology Detection</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Identify financial crime patterns hidden in any data format</p>
 </div>

 {/* Network Mapping Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-cyan-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Network className="w-6 h-6 text-cyan-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Network Mapping</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Visualize corporate structures and ownership chains to uncover hidden connections</p>
 </div>

 {/* Risk Scoring Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-rose-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <AlertTriangle className="w-6 h-6 text-rose-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Risk Scoring</h4>
 <p className="text-sm text-gray-600 leading-relaxed">AI-powered risk assessment with confidence scores and supporting evidence</p>
 </div>

 {/* Document Intelligence Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-orange-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <FileText className="w-6 h-6 text-orange-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Document Intelligence</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Process emails, financials, contracts, and corporate filings in any format</p>
 </div>

 {/* Generating hypotheses Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-yellow-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Lightbulb className="w-6 h-6 text-yellow-600" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Generating hypotheses</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Generate investigative leads and theories based on pattern analysis</p>
 </div>

 {/* Screening sanctions Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-red-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Globe className="w-6 h-6 text-red-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Global Sanctions</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Screen against OFAC, EU, UK, UN sanctions lists with alias matching</p>
 </div>

 {/* Report Generation Card */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-indigo-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Download className="w-6 h-6 text-indigo-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Export Reports</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Generate comprehensive PDF reports ready for regulatory submission</p>
 </div>
 </div>
 </div>
 </div>

 {/* Customer Types Section */}
 <div className="py-20 px-6">
 <div className="max-w-6xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="text-4xl font-bold tracking-tight mb-4">Built by investigators, for investigators</h2>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
 {/* Fintech */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Zap className="w-6 h-6 text-violet-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Fintech</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Payment processors, neobanks, and crypto platforms scaling compliance operations</p>
 </div>

 {/* Risk Consulting */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Scale className="w-6 h-6 text-blue-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Risk Consulting</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Advisory firms conducting due diligence and forensic investigations for clients</p>
 </div>

 {/* Banking */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Building2 className="w-6 h-6 text-emerald-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Banking</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Financial institutions managing AML compliance and fraud investigation teams</p>
 </div>

 {/* Corporates */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Briefcase className="w-6 h-6 text-slate-500" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Corporates</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Internal audit and corporate security teams investigating misconduct and fraud</p>
 </div>

 {/* Public Sector */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <Flag className="w-6 h-6 text-amber-600" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Public Sector</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Government agencies and regulators enforcing financial crime laws</p>
 </div>

 {/* Private Investigators */}
 <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md shadow-gray-200/50 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
 <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
 <UserSearch className="w-6 h-6 text-gray-600" />
 </div>
 <h4 className="font-bold text-gray-900 mb-2">Private Investigators</h4>
 <p className="text-sm text-gray-600 leading-relaxed">Licensed investigators conducting asset traces and background research</p>
 </div>
 </div>
 </div>
 </div>

 {/* CTA Section */}
 <div className="py-24 px-6 bg-gray-900">
 <div className="max-w-4xl mx-auto text-center">
 <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-10 text-white leading-tight">
 Ready to accelerate your investigations?
 </h2>
 <button
 onClick={startNewCase}
 className="group bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20 inline-flex items-center gap-2"
 >
 <span>Get Started</span>
 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Case Management Page */}
 {currentPage === 'existingCases' && (
 <>
 {/* Navigation Buttons - Upper Left Corner */}
 <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
 {/* Home Button with tooltip */}
 <div className="relative group">
 <button
 onClick={goToLanding}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <Home className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Home</div>
 </div>
 </div>

 {/* New Case Button with tooltip */}
 <div className="relative group">
 <button
 onClick={() => setCurrentPage('newCase')}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <Plus className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">New Case</div>
 </div>
 </div>
 </div>

 <div className="fade-in pt-24 px-24">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h2 className="text-2xl font-bold tracking-tight leading-tight">Case Management</h2>
 <p className="text-gray-600">{cases.length} investigation{cases.length !== 1 ? 's' : ''} on file</p>
 </div>
 <button
 onClick={startNewCase}
 className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold tracking-wide px-4 py-2 rounded-xl transition-colors"
 >
 <Plus className="w-4 h-4" />
 New Case
 </button>
 </div>

 {cases.length === 0 ? (
 <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
 <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
 <FolderOpen className="w-10 h-10 text-gray-400" />
 </div>
 <h3 className="text-xl font-bold tracking-tight mb-2 leading-tight">No Cases Yet</h3>
 <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-md mx-auto">
 Start your first investigation by uploading evidence documents. 
 Marlowe will analyze and organize your findings.
 </p>
 <button
 onClick={startNewCase}
 className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold tracking-wide px-6 py-3 rounded-xl transition-colors"
 >
 <Plus className="w-5 h-5" />
 Start First Case
 </button>
 </div>
 ) : (
 <div className="grid gap-4">
 {cases.map((caseItem) => (
 <div
 key={caseItem.id}
 onClick={() => editingCaseId !== caseItem.id && loadCase(caseItem)}
 className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-6 cursor-pointer transition-all group"
 >
 <div className="flex items-start gap-4">
 <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
 caseItem.riskLevel === 'CRITICAL' ? 'bg-red-600/20' :
 caseItem.riskLevel === 'HIGH' ? 'bg-rose-50 border border-rose-200' :
 caseItem.riskLevel === 'MEDIUM' ? 'bg-amber-50 border border-amber-200' :
 'bg-emerald-50 border border-emerald-200'
 }`}>
 <Folder className={`w-7 h-7 ${
 caseItem.riskLevel === 'CRITICAL' ? 'text-red-600' :
 caseItem.riskLevel === 'HIGH' ? 'text-rose-500' :
 caseItem.riskLevel === 'MEDIUM' ? 'text-amber-500' :
 'text-emerald-500'
 }`} />
 </div>
 
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-2">
 {editingCaseId === caseItem.id ? (
 <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
 <input
 ref={editInputRef}
 type="text"
 value={editingCaseName}
 onChange={(e) => setEditingCaseName(e.target.value)}
 onKeyDown={handleEditKeyPress}
 onBlur={saveEditedCaseName}
 className="flex-1 bg-gray-100 border border-amber-500 rounded-lg px-3 py-1.5 text-gray-900 text-lg font-semibold leading-tight focus:outline-none"
 />
 <button
 onClick={saveEditedCaseName}
 className="p-2 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors"
 >
 <Check className="w-4 h-4 text-gray-900" />
 </button>
 </div>
 ) : (
 <>
 <h3 className="text-lg font-semibold leading-tight">{caseItem.name}</h3>
 <button
 onClick={(e) => startEditingCase(caseItem, e)}
 className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
 >
 <Pencil className="w-4 h-4 text-gray-500 hover:text-amber-500" />
 </button>
 <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${getRiskColor(caseItem.riskLevel)}`}>
 {caseItem.riskLevel} RISK
 </span>
 </>
 )}
 </div>
 
 <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
 {caseItem.analysis?.executiveSummary?.overview || 'No summary available'}
 </p>
 
 <div className="flex items-center gap-4 text-xs text-gray-500">
 <span className="flex items-center gap-1">
 <FileText className="w-3.5 h-3.5" />
 {caseItem.files.length} documents
 </span>
 <span className="flex items-center gap-1">
 <Users className="w-3.5 h-3.5" />
 {caseItem.analysis?.entities?.length || 0} entities
 </span>
 <span className="flex items-center gap-1">
 <Lightbulb className="w-3.5 h-3.5" />
 {caseItem.analysis?.hypotheses?.length || 0} hypotheses
 </span>
 <span className="flex items-center gap-1">
 <Calendar className="w-3.5 h-3.5" />
 {new Date(caseItem.createdAt).toLocaleDateString()}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={(e) => deleteCase(caseItem.id, e)}
 className="p-2 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
 >
 <Trash2 className="w-4 h-4 text-rose-500" />
 </button>
 <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </>
 )}

 {/* New Case / Evidence Upload Section */}
 {(currentPage === 'newCase' || currentPage === 'activeCase') && !analysis && (
          <>
 {/* Home Button and Case Management Button - Upper Left Corner */}
 <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
 {/* Home Button with tooltip */}
 <div className="relative group">
 <button
 onClick={goToLanding}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <Home className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Home</div>
 </div>
 </div>

 {/* Case Management Button with tooltip */}
 <div className="relative group">
 <button
 onClick={() => setCurrentPage('existingCases')}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <FolderOpen className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Case Management</div>
 </div>
 </div>

          {/* Dark Mode Toggle with tooltip */}
          <div className="relative group">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
              )}
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">{darkMode ? 'Light Mode' : 'Dark Mode'}</div>
            </div>
          </div>
 </div>

          <div className="min-h-[calc(100vh-200px)] flex flex-col justify-start pt-24 px-48">
 <section className="mb-8 fade-in">
 {/* Main Prompt Box - Claude-style */}
 <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-6">
 {/* Prompt Input */}
 <div className="relative">
 <textarea
 value={caseDescription}
 onChange={(e) => setCaseDescription(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 if (caseDescription.trim()) {
 analyzeEvidence();
 }
 }
 }}
                placeholder=""
                className="w-full bg-transparent text-gray-900 focus:outline-none resize-none text-base leading-relaxed min-h-[120px]"
 style={{ fontFamily: "'Inter', sans-serif" }}
 />
 {caseDescription.trim() === '' && (
 <div
 key={placeholderIndex}
 className="absolute top-0 left-0 text-gray-500 text-base leading-relaxed pointer-events-none animate-fadeInOut"
 style={{ fontFamily: "'Inter', sans-serif" }}
 >
 {placeholderExamples[placeholderIndex]}
 </div>
 )}
 </div>

 {/* Bottom Toolbar */}
 <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
 <div className="flex items-center gap-2">
 {/* Add Materials Button */}
 <div
 className="relative"
 onDragEnter={handleDrag}
 onDragLeave={handleDrag}
 onDragOver={handleDrag}
 onDrop={handleDrop}
 >
 <input
 ref={fileInputRef}
 type="file"
 multiple
 accept=".txt,.pdf,.doc,.docx,.csv,.json,.xml"
 onChange={handleFileInput}
 className="hidden"
 />
 <div className="relative" ref={uploadDropdownRef}>
 <button
 onClick={() => setShowUploadDropdown(!showUploadDropdown)}
 className="group p-2 hover:bg-gray-100 rounded-lg transition-all relative"
 >
 <Plus className="w-5 h-5 text-gray-600 group-hover:text-amber-500 transition-colors" />
 <span className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity pointer-events-none ${showUploadDropdown ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}>
 Upload Materials
 </span>
 </button>

 {/* Upload Dropdown Menu */}
 {showUploadDropdown && (
 <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
 <button
 onClick={() => {
 fileInputRef.current?.click();
 setShowUploadDropdown(false);
 }}
 className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
 >
 <Upload className="w-4 h-4 text-gray-500" />
 Upload from Computer
 </button>
 <button
 onClick={() => {
 handleGoogleDrivePicker();
 setShowUploadDropdown(false);
 }}
 className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
 >
 <svg className="w-4 h-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
 <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
 <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
 <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
 <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
 <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
 <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
 </svg>
 Import from Google Drive
 </button>
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="flex items-center gap-0">
 {/* Mode Selector Dropdown */}
 <div className="relative group" ref={modeDropdownRef}>
 <button
 onClick={() => setShowModeDropdown(!showModeDropdown)}
 className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-300 text-white disabled:text-gray-500 font-medium tracking-wide px-2 py-2 rounded-l-lg transition-all flex items-center border-r border-amber-700"
 disabled={isAnalyzing}
 >
 <ChevronDown className="w-4 h-4" />
 </button>
 <span className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity pointer-events-none z-50 ${showModeDropdown ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}>
 Select Mode
 </span>

 {showModeDropdown && (
 <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-sm border border-gray-300/50 rounded-lg shadow-sm z-50">
 <button
 onClick={() => {
 setInvestigationMode('cipher');
 setShowModeDropdown(false);
 }}
 className={`w-full text-left px-3 py-2 hover:bg-gray-100/50 transition-colors border-b border-gray-200/50 rounded-t-lg ${
 investigationMode === 'cipher' ? 'bg-amber-50/50' : ''
 }`}
 >
 <div className="text-sm font-medium text-gray-900">Cipher</div>
 <div className="text-[10px] text-gray-500">Deep Investigations</div>
 </button>
 <button
 onClick={() => {
 setInvestigationMode('scout');
 setShowModeDropdown(false);
 }}
 className={`w-full text-left px-3 py-2 hover:bg-gray-100/50 transition-colors rounded-b-lg ${
 investigationMode === 'scout' ? 'bg-emerald-50/50' : ''
 }`}
 >
 <div className="text-sm font-medium text-gray-900">Scout</div>
 <div className="text-[10px] text-gray-500">Lightweight Screenings</div>
 </button>
 </div>
 )}
 </div>

 {/* Start Investigation Button */}
 <div className="relative group">
 <button
 onClick={analyzeEvidence}
 disabled={isAnalyzing || backgroundAnalysis.isRunning || (!caseDescription.trim() && files.length === 0)}
 className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-300 text-white disabled:text-gray-500 font-medium tracking-wide px-3 py-2 rounded-r-lg transition-all flex items-center disabled:opacity-50"
 >
 {(isAnalyzing || backgroundAnalysis.isRunning) ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <ArrowRight className="w-4 h-4" />
 )}
 </button>
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
 {isAnalyzing ? 'Analyzing...' : 'Begin Analysis'}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Uploaded Files */}
 {files.length > 0 && (
 <div className="mt-6">
 <p className="text-sm text-gray-700 leading-relaxed mb-3 mono">
 {files.length} DOCUMENT{files.length > 1 ? 'S' : ''} LOADED
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {files.map((file, idx) => (
 <div
 key={file.id}
 className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3 group hover:border-gray-300 transition-colors"
 >
 <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
 <span className="mono text-xs tracking-wide text-amber-500">{idx + 1}</span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-sm leading-tight truncate">{file.name}</p>
 <p className="text-xs text-gray-600 mono tracking-wide mt-1">
 {(file.size / 1024).toFixed(1)} KB • {file.content.split(/\s+/).length} words
 </p>
 </div>
 <button
 onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
 className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
 >
 <X className="w-4 h-4 text-gray-600" />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}
 </section>

 {/* Progress Card - Shows during analysis or when complete */}
 {(backgroundAnalysis.isRunning || backgroundAnalysis.isComplete) && (
   <div className="mt-4">
     <div className={`bg-white/50 backdrop-blur-sm border rounded-2xl p-6 ${backgroundAnalysis.isComplete ? 'border-emerald-300' : 'border-gray-200'}`}>
       {/* Case Name */}
       <div className="flex items-center gap-3 mb-4">
         <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${backgroundAnalysis.isComplete ? 'bg-emerald-100' : 'bg-amber-100'}`}>
           {backgroundAnalysis.isComplete ? (
             <CheckCircle2 className="w-5 h-5 text-emerald-600" />
           ) : (
             <Briefcase className="w-5 h-5 text-amber-600" />
           )}
         </div>
         <div>
           <h3 className="font-semibold text-gray-900">{backgroundAnalysis.caseName || 'Processing...'}</h3>
           <p className={`text-xs mono tracking-wide ${backgroundAnalysis.isComplete ? 'text-emerald-600' : 'text-gray-500'}`}>
             {backgroundAnalysis.isComplete ? 'ANALYSIS COMPLETE' : 'CASE ANALYSIS IN PROGRESS'}
           </p>
         </div>
       </div>

       {/* Progress Bar */}
       <div className="mb-4">
         <div className="flex justify-between items-center mb-2">
           <span className="text-sm text-gray-600">{backgroundAnalysis.currentStep}</span>
           <span className={`text-sm font-medium ${backgroundAnalysis.isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>{backgroundAnalysis.progress}%</span>
         </div>
         <div className="w-full bg-gray-100 rounded-full h-2">
           <div
             className={`h-2 rounded-full transition-all duration-500 ease-out ${backgroundAnalysis.isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
             style={{ width: `${backgroundAnalysis.progress}%` }}
           />
         </div>
       </div>

       {/* Time Remaining or View Results Button */}
       {backgroundAnalysis.isComplete ? (
         <button
           onClick={viewAnalysisResults}
           className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
         >
           <Eye className="w-4 h-4" />
           View Results
         </button>
       ) : (
         <div className="flex items-center justify-between text-sm">
           <div className="flex items-center gap-2 text-gray-500">
             <Clock className="w-4 h-4" />
             <span>~{Math.max(5, Math.round((100 - backgroundAnalysis.progress) * 0.3))} seconds remaining</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
             <span className="text-gray-600 mono text-xs">ANALYZING</span>
           </div>
         </div>
       )}
     </div>
   </div>
 )}
          </div>
          </>
 )}

 {/* Analysis Results */}
 {(currentPage === 'newCase' || currentPage === 'activeCase') && analysis && (
 <>
 {/* Top Left Navigation Buttons */}
 <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
 {/* Home Button with tooltip */}
 <div className="relative group">
 <button
 onClick={goToLanding}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <Home className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Home</div>
 </div>
 </div>

 {/* Case Management Button with tooltip */}
 <div className="relative group">
 <button
 onClick={() => setCurrentPage('existingCases')}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <FolderOpen className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">Case Management</div>
 </div>
 </div>

 {/* Dark Mode Toggle with tooltip */}
 <div className="relative group">
 <button
 onClick={() => setDarkMode(!darkMode)}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 {darkMode ? (
 <Sun className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
 ) : (
 <Moon className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
 )}
 </button>
 <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">{darkMode ? 'Light Mode' : 'Dark Mode'}</div>
 </div>
 </div>
 </div>

 <div className="fade-in flex pt-24 pl-36 pr-12">
 {/* Left Navigation Panel - Scrolls with page */}
 <div className="w-48 flex-shrink-0 pl-2 pr-1 py-8">
 <div className="sticky top-8 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-4">
 <div className="flex flex-col gap-1.5">
 {[
 { id: 'overview', label: 'Overview', icon: Eye },
 { id: 'timeline', label: 'Timeline', icon: Clock },
 { id: 'entities', label: 'Entities', icon: Users },
 { id: 'typologies', label: 'Typologies', icon: Target },
 { id: 'hypotheses', label: 'Hypotheses', icon: Lightbulb },
 { id: 'network', label: 'Network', icon: Network },
 { id: 'evidence', label: 'Evidence', icon: FileText },
 ].filter(tab => {
 // Hide Timeline tab if there are no timeline events
 if (tab.id === 'timeline' && (!analysis.timeline || analysis.timeline.length === 0)) {
 return false;
 }
 return true;
 }).map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold transition-all ${
 activeTab === tab.id
 ? 'bg-amber-500 text-white shadow-lg'
 : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
 }`}
 >
 <tab.icon className="w-4 h-4 flex-shrink-0" />
 <span className="text-sm">{tab.label}</span>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="flex-1 max-w-full mx-auto px-2">

 {/* Overview Tab */}
 {activeTab === 'overview' && (
 <div className="space-y-6">
 {/* Editable Case Name */}
 <div className="bg-white rounded-xl border border-gray-200 p-8">
 {isEditingCaseName ? (
 <input
 type="text"
 value={tempCaseName}
 onChange={(e) => setTempCaseName(e.target.value)}
 onBlur={() => {
 if (tempCaseName.trim()) {
 setCaseName(tempCaseName.trim());
 }
 setIsEditingCaseName(false);
 }}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 if (tempCaseName.trim()) {
 setCaseName(tempCaseName.trim());
 }
 setIsEditingCaseName(false);
 } else if (e.key === 'Escape') {
 setIsEditingCaseName(false);
 }
 }}
 className="w-full text-2xl font-semibold text-gray-900 border-b-2 border-amber-500 focus:outline-none px-2 py-1"
 autoFocus
 />
 ) : (
 <div
 onClick={() => {
 setTempCaseName(caseName);
 setIsEditingCaseName(true);
 }}
 className="flex items-center gap-3 cursor-pointer group"
 >
 <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
 {caseName || 'Untitled Case'}
 </h2>
 <Pencil className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 )}
 <p className="text-sm text-gray-500 mt-2">Click to edit case name</p>
 </div>

 {/* Executive Summary Card */}
 <div className={`bg-white rounded-xl border-l-4 ${getRiskBorder(analysis.executiveSummary?.riskLevel)} p-8`}>
 <div className="flex items-start justify-between gap-4 mb-4">
 <div>
 <h3 className="text-lg font-semibold leading-tight flex items-center gap-2">
 <AlertTriangle className="w-5 h-5 text-amber-500" />
 Executive Summary
 </h3>
 </div>
 <div className="flex items-center gap-3">
 <button
 onClick={generateCaseReportPdf}
 disabled={isGeneratingCaseReport}
 className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-lg text-sm font-medium tracking-wide transition-colors disabled:opacity-50"
 >
 {isGeneratingCaseReport ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Download className="w-4 h-4" />
 )}
 {isGeneratingCaseReport ? 'Generating PDF...' : 'Export PDF Report'}
 </button>
 <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide mono tracking-wide ${getRiskColor(analysis.executiveSummary?.riskLevel)}`}>
 {analysis.executiveSummary?.riskLevel || 'UNKNOWN'} RISK
 </span>
 </div>
 </div>

 <p className="text-gray-600 leading-relaxed mb-6">
 {analysis.executiveSummary?.overview}
 </p>

 {/* Sanctions-Related Ownership Findings */}
 {analysis.automatedInvestigations && analysis.automatedInvestigations.some(f =>
 f.findingType === 'OWNERSHIP_MAPPING' ||
 f.findingType === 'SANCTIONED_OWNERSHIP' ||
 f.findingType === 'CORPORATE_NETWORK'
 ) && (
 <div className="mb-6 p-4 bg-red-50/30 border border-red-800/50 rounded-lg">
 <h4 className="text-sm font-bold text-rose-600 mb-3 flex items-center gap-2">
 <ShieldAlert className="w-4 h-4" />
 SANCTIONS-RELATED OWNERSHIP FINDINGS
 </h4>
 <div className="space-y-2">
 {analysis.automatedInvestigations
 .filter(f => f.findingType === 'OWNERSHIP_MAPPING' || f.findingType === 'SANCTIONED_OWNERSHIP' || f.findingType === 'CORPORATE_NETWORK')
 .map((finding, idx) => (
 <div key={idx} className="flex items-start gap-2">
 <ChevronRight className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
 <div className="text-sm">
 <span className="font-medium tracking-wide text-red-600">{finding.title}:</span>
 <span className="text-gray-600 ml-1">{finding.description}</span>
 {finding.findingType === 'OWNERSHIP_MAPPING' && finding.data && (
 <span className="text-rose-600 ml-1 font-bold">
 ({finding.data.controllingInterest} controlling interests in {finding.data.totalEntities} entities)
 </span>
 )}
 {finding.findingType === 'SANCTIONED_OWNERSHIP' && finding.data?.ofacRuleTriggered && (
 <span className="text-rose-600 ml-1 font-bold">(OFAC 50% Rule Triggered)</span>
 )}
 {finding.findingType === 'CORPORATE_NETWORK' && finding.data && (
 <span className="text-rose-600 ml-1 font-bold">
 ({finding.data.directExposure} with direct sanctions exposure)
 </span>
 )}
 </div>
 </div>
 ))
 }
 </div>
 </div>
 )}

 <div className="grid md:grid-cols-2 gap-6">
 <div>
 <h4 className="text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-3 flex items-center gap-2">
 <XCircle className="w-4 h-4 text-rose-500" />
 Primary Concerns
 </h4>
 <ul className="space-y-2">
 {analysis.executiveSummary?.primaryConcerns?.map((concern, idx) => (
 <li key={idx} className="flex items-start gap-2 text-sm">
 <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
 <span>{concern}</span>
 </li>
 ))}
 </ul>
 </div>
 <div>
 <h4 className="text-sm font-medium tracking-wide text-gray-600 tracking-wide mb-3 flex items-center gap-2">
 <Target className="w-4 h-4 text-amber-500" />
 Recommended Actions
 </h4>
 <ul className="space-y-2">
 {analysis.executiveSummary?.recommendedActions?.map((action, idx) => (
 <li key={idx} className="flex items-start gap-2 text-sm">
 <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 <span>{action}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { label: 'Entities', value: analysis.entities?.length || 0, icon: Users, color: 'text-blue-600' },
 { label: 'Timeline Events', value: analysis.timeline?.length || 0, icon: Clock, color: 'text-emerald-600' },
 { label: 'Hypotheses', value: analysis.hypotheses?.length || 0, icon: Lightbulb, color: 'text-amber-600' },
 { label: 'Patterns', value: analysis.patterns?.length || 0, icon: Network, color: 'text-purple-600' },
 ].map(stat => (
 <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
 <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
 <p className="text-4xl font-bold tracking-tight leading-tight">{stat.value}</p>
 <p className="text-xs text-gray-500 mono tracking-wide">{stat.label.toUpperCase()}</p>
 </div>
 ))}
 </div>

 {/* Automated Investigations Summary */}
 {analysis.automatedInvestigations && analysis.automatedInvestigations.length > 0 && (
 <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
 <Zap className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="text-lg font-semibold leading-tight text-gray-900 leading-tight">Automated Investigations Completed</h3>
 <p className="text-sm text-blue-600">Marlowe automatically executed {analysis.automatedInvestigations.length} investigative {analysis.automatedInvestigations.length === 1 ? 'task' : 'tasks'}</p>
 </div>
 </div>
 <div className="space-y-3">
 {analysis.automatedInvestigations.map((finding, idx) => {
 const isExpanded = expandedInvestigations[idx];
 return (
 <div key={idx} className="bg-white/80 border border-blue-800/30 rounded-lg overflow-hidden">
 <button
 onClick={() => setExpandedInvestigations(prev => ({
 ...prev,
 [idx]: !prev[idx]
 }))}
 className="w-full p-4 text-left flex items-start gap-3 hover:bg-gray-100/50 transition-colors"
 >
 <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="font-medium tracking-wide text-sm text-white mb-1">{finding.title}</p>
 <p className="text-xs text-gray-600">{finding.description}</p>
 </div>
 {isExpanded
 ? <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
 : <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
 }
 </button>

 {isExpanded && (
 <div className="px-4 pb-4 border-t border-gray-300 pt-4 fade-in">
 {finding.findingType === 'OWNERSHIP_MAPPING' && finding.data && (
 <div className="space-y-3">
 <div className="grid grid-cols-2 gap-4 p-5 bg-gray-100/50 rounded-lg">
 <div>
 <p className="text-xs text-gray-500 mb-1">Total Entities</p>
 <p className="text-lg font-semibold tracking-wide text-gray-900 leading-tight">{finding.data.totalEntities}</p>
 </div>
 <div>
 <p className="text-xs text-gray-500 mb-1">Controlling Interest</p>
 <p className="text-lg font-semibold tracking-wide text-amber-600 leading-tight">{finding.data.controllingInterest}</p>
 </div>
 </div>
 {finding.data.companies && finding.data.companies.length > 0 && (
 <div>
 <h5 className="text-xs font-bold tracking-wide text-base text-gray-600 leading-relaxed mb-2">OWNED ENTITIES:</h5>
 <div className="space-y-2">
 {finding.data.companies.map((company, cidx) => (
 <div key={cidx} className="flex items-center justify-between p-2 bg-gray-100/30 rounded text-xs">
 <span className="text-base text-gray-900 leading-relaxed">{company.name}</span>
 <div className="flex items-center gap-2">
 <span className="font-bold text-gray-900">{company.ownership}%</span>
 {company.ownership >= 50 && (
 <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">CONTROL</span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {finding.findingType === 'SANCTIONED_OWNERSHIP' && finding.data && (
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 bg-red-50/30 rounded-lg">
 <div>
 <p className="text-xs text-base text-gray-600 leading-relaxed mb-1">Aggregate Sanctioned Ownership</p>
 <p className="text-2xl font-bold tracking-tight leading-tight text-rose-600 leading-tight">{finding.data.aggregateOwnership}%</p>
 </div>
 {finding.data.ofacRuleTriggered && (
 <span className="text-xs px-3 py-1.5 bg-red-600 text-white rounded font-bold">OFAC 50% RULE</span>
 )}
 </div>
 {finding.data.sanctionedOwners && finding.data.sanctionedOwners.length > 0 && (
 <div>
 <h5 className="text-xs font-bold tracking-wide text-base text-gray-600 leading-relaxed mb-2">SANCTIONED BENEFICIAL OWNERS:</h5>
 <div className="space-y-2">
 {finding.data.sanctionedOwners.map((owner, oidx) => (
 <div key={oidx} className="p-3 bg-gray-100/30 rounded">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-medium tracking-wide text-gray-900">{owner.name}</span>
 <span className="text-sm font-bold text-rose-600">{owner.ownership}%</span>
 </div>
 <div className="flex flex-wrap gap-1">
 {owner.lists && owner.lists.map((list, lidx) => (
 <span key={lidx} className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded text-[10px] font-medium tracking-wide">{list}</span>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {finding.findingType === 'CORPORATE_NETWORK' && finding.data && (
 <div className="space-y-3">
 <div className="grid grid-cols-2 gap-4 p-5 bg-gray-100/50 rounded-lg">
 <div>
 <p className="text-xs text-gray-500 mb-1">Related Entities</p>
 <p className="text-lg font-semibold tracking-wide text-gray-900 leading-tight">{finding.data.totalRelated}</p>
 </div>
 <div>
 <p className="text-xs text-gray-500 mb-1">Direct Exposure</p>
 <p className="text-lg font-semibold tracking-wide text-rose-600 leading-tight">{finding.data.directExposure}</p>
 </div>
 </div>
 {finding.data.relatedEntities && finding.data.relatedEntities.length > 0 && (
 <div>
 <h5 className="text-xs font-bold tracking-wide text-base text-gray-600 leading-relaxed mb-2">CORPORATE NETWORK:</h5>
 <div className="space-y-2">
 {finding.data.relatedEntities.map((entity, eidx) => (
 <div key={eidx} className={`p-3 rounded ${
 entity.sanctionExposure === 'DIRECT' ? 'bg-red-50/30 border border-red-800/50' :
 entity.sanctionExposure === 'INDIRECT' ? 'bg-rose-50/30 border border-rose-800/50' :
 'bg-gray-100/30'
 }`}>
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium tracking-wide text-gray-900">{entity.name}</span>
 <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">{entity.relationship}</span>
 </div>
 <div className="flex items-center gap-2 text-xs">
 {entity.commonOwner && (
 <span className="text-gray-500">Common Owner: <span className="text-gray-600">{entity.commonOwner}</span></span>
 )}
 {entity.sanctionExposure && entity.sanctionExposure !== 'NONE' && (
 <span className={`px-2 py-0.5 rounded font-medium ${
 entity.sanctionExposure === 'DIRECT' ? 'bg-red-600 text-white' :
 entity.sanctionExposure === 'INDIRECT' ? 'bg-rose-600 text-white' :
 'bg-gray-300 text-gray-700'
 }`}>
 {entity.sanctionExposure} EXPOSURE
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Next Steps */}
 {analysis.nextSteps && analysis.nextSteps.length > 0 && (
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h3 className="text-lg font-semibold leading-tight mb-4 flex items-center gap-2">
 <ArrowRight className="w-5 h-5 text-amber-500" />
 Investigative Next Steps
 </h3>
 <div className="space-y-3">
 {analysis.nextSteps.map((step, idx) => (
 <div
 key={idx}
 className={`p-5 rounded-lg border-l-4 ${getRiskBorder(step.priority)} bg-gray-100/50`}
 >
 <div className="flex items-start gap-3 mb-3">
 <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide mono tracking-wide ${getRiskColor(step.priority)} shrink-0`}>
 {step.priority}
 </span>
 <p className="font-medium tracking-wide text-gray-900 leading-relaxed">{step.action}</p>
 </div>
 <p className="text-base text-gray-900 leading-relaxed mb-3 pl-0">{step.rationale}</p>
 {step.expectedOutcome && (
 <div className="text-sm text-gray-600 leading-relaxed pl-0 pt-3 border-t border-gray-300">
 <span className="text-gray-500 font-medium tracking-wide">Expected Outcome:</span> {step.expectedOutcome}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Timeline Tab */}
 {activeTab === 'timeline' && (
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h3 className="text-lg font-semibold leading-tight mb-6 flex items-center gap-2">
 <Clock className="w-5 h-5 text-amber-500" />
 Chronological Timeline
 </h3>
 
 <div className="relative">
 {/* Timeline line */}
 <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />
 
 <div className="space-y-4">
 {analysis.timeline?.map((event, idx) => (
 <div
 key={event.id || idx}
 className={`relative pl-16 cursor-pointer group`}
 onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
 >
 {/* Timeline dot */}
 <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
 event.riskLevel === 'HIGH' ? 'bg-rose-500 border-rose-400' :
 event.riskLevel === 'MEDIUM' ? 'bg-amber-500 border-amber-400' :
 'bg-emerald-500 border-emerald-400'
 }`} />
 
 <div className={`bg-gray-100/50 rounded-lg p-4 border transition-all ${
 selectedEvent?.id === event.id ? 'border-amber-500' : 'border-gray-300 hover:border-gray-400'
 }`}>
 <div className="flex items-center gap-3 mb-2">
 <span className="mono text-xs tracking-wide text-amber-600 bg-amber-500/10 px-2 py-1 rounded">
 {event.date}
 </span>
 <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${getRiskColor(event.riskLevel)}`}>
 {event.riskLevel}
 </span>
 </div>
 
 <p className="font-medium text-gray-900 leading-relaxed mb-2">{event.event}</p>
 
 {selectedEvent?.id === event.id && (
 <div className="mt-4 pt-4 border-t border-gray-300 space-y-3 fade-in">
 <div>
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-1">SIGNIFICANCE</p>
 <p className="text-base text-gray-900 leading-relaxed">{event.significance}</p>
 </div>
 
 {event.citations && event.citations.length > 0 && (
 <div>
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-2">CITATIONS</p>
 {event.citations.map((citation, cidx) => (
 <div key={cidx} className="flex items-start gap-2 text-sm bg-white p-2 rounded mb-1">
 <Link2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 <span className="text-gray-600">{citation}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* Entities Tab */}
 {activeTab === 'entities' && (
 <div className="grid lg:grid-cols-3 gap-6">
 {/* Entity List */}
 <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4">
 <h3 className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-4">
 EXTRACTED ENTITIES ({analysis.entities?.length || 0})
 </h3>
 <div className="space-y-2 max-h-[600px] overflow-y-auto">
 {analysis.entities?.map((entity, idx) => (
 <button
 key={entity.id || idx}
 onClick={() => setSelectedEntity(entity)}
 className={`w-full text-left p-5 rounded-lg transition-all ${
 selectedEntity?.id === entity.id
 ? 'bg-amber-50 border border-amber-200 border border-amber-500'
 : 'bg-gray-100/50 border border-gray-300 hover:border-gray-400'
 }`}
 >
 <div className="flex items-center gap-3">
 {entity.type === 'PERSON' && (
 <img
 src={`https://ui-avatars.com/api/?name=${encodeURIComponent(entity.name)}&background=d4af37&color=0a0a0f&size=64&bold=true`}
 alt={entity.name}
 className="w-10 h-10 rounded-full border border-gray-300"
 />
 )}
 <div className="flex-1 min-w-0">
 <span className="font-medium text-sm leading-tight block">{entity.name}</span>
 <span className="text-xs mono text-gray-500 tracking-wide">{entity.type}</span>
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>

 {/* Entity Detail */}
 <div className="lg:col-span-2">
 {selectedEntity ? (
 <div className={`bg-white border-l-4 ${getRiskBorder(selectedEntity.riskLevel)} rounded-xl p-6 fade-in`}>
 <div className="flex items-start justify-between mb-6">
 <div className="flex items-start gap-4 flex-1">
 {selectedEntity.type === 'PERSON' && (
 <img
 src={`https://logo.clearbit.com/${encodeURIComponent(selectedEntity.name.toLowerCase().replace(/\s+/g, ''))}.com`}
 alt={selectedEntity.name}
 className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
 onError={(e) => {
 e.target.onerror = null;
 e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEntity.name)}&background=d4af37&color=0a0a0f&size=128&bold=true`;
 }}
 />
 )}
 <div>
 <h3 className="text-xl font-bold tracking-tight leading-tight">{selectedEntity.name}</h3>
 <p className="mono tracking-wide text-sm text-gray-600">{selectedEntity.type}</p>
 </div>
 </div>
 <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(selectedEntity.riskLevel)}`}>
 {selectedEntity.riskLevel} RISK
 </span>
 </div>

 <div className="space-y-6">
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2">Role in Investigation</h4>
 <p className="text-base text-gray-900 leading-relaxed">{selectedEntity.role}</p>
 </div>

 {/* Sanctions Status */}
 {selectedEntity.sanctionStatus && selectedEntity.sanctionStatus !== 'UNKNOWN' && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Shield className="w-4 h-4" />
 Screening sanctions
 </h4>
 <div className={`p-5 rounded-lg border-2 ${
 selectedEntity.sanctionStatus === 'MATCH' ? 'bg-red-600/10 border-red-600' :
 selectedEntity.sanctionStatus === 'POTENTIAL_MATCH' ? 'bg-rose-500/10 border-rose-500' :
 'bg-emerald-500/10 border-emerald-500'
 }`}>
 <div className="flex items-center gap-2">
 {selectedEntity.sanctionStatus === 'MATCH' ? (
 <>
 <ShieldAlert className="w-5 h-5 text-red-600" />
 <span className="font-bold text-red-600 tracking-wide">SANCTIONED ENTITY</span>
 </>
 ) : selectedEntity.sanctionStatus === 'POTENTIAL_MATCH' ? (
 <>
 <AlertTriangle className="w-5 h-5 text-rose-500" />
 <span className="font-bold text-rose-500 tracking-wide">POTENTIAL SANCTIONS MATCH</span>
 </>
 ) : (
 <>
 <ShieldCheck className="w-5 h-5 text-emerald-500" />
 <span className="font-bold text-emerald-500 tracking-wide">NO SANCTIONS MATCH</span>
 </>
 )}
 </div>
 </div>
 </div>
 )}

 {/* PEP Status */}
 {selectedEntity.pepStatus && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Flag className="w-4 h-4" />
 Political Exposure
 </h4>
 <div className="p-5 rounded-lg bg-purple-500/10 border-2 border-purple-500">
 <div className="flex items-center gap-2">
 <Flag className="w-5 h-5 text-purple-500" />
 <span className="font-bold text-purple-500 tracking-wide">POLITICALLY EXPOSED PERSON (PEP)</span>
 </div>
 </div>
 </div>
 )}

 {/* Ownership Portfolio (for individuals) */}
 {selectedEntity.type === 'PERSON' && selectedEntity.ownedCompanies && selectedEntity.ownedCompanies.length > 0 && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Building2 className="w-4 h-4" />
 Ownership Portfolio ({selectedEntity.ownedCompanies.length} {selectedEntity.ownedCompanies.length === 1 ? 'Company' : 'Companies'})
 </h4>
 <div className="mb-3 p-5 bg-gray-100/50 rounded-lg">
 <div className="grid grid-cols-2 gap-4 text-xs">
 <div>
 <span className="text-gray-500">Total Companies:</span>
 <span className="ml-2 font-bold text-gray-900">{selectedEntity.ownedCompanies.length}</span>
 </div>
 <div>
 <span className="text-gray-500">High-Risk (≥50%):</span>
 <span className="ml-2 font-bold text-rose-600">
 {selectedEntity.ownedCompanies.filter(c => c.ownershipPercent >= 50).length}
 </span>
 </div>
 </div>
 </div>
 <div className="space-y-2">
 {selectedEntity.ownedCompanies.map((company, idx) => (
 <div key={idx} className={`p-5 rounded-lg border ${
 company.ownershipPercent >= 50 ? 'bg-red-600/10 border-red-600/50' :
 company.ownershipPercent >= 25 ? 'bg-rose-500/10 border-rose-500/50' :
 'bg-gray-100/50 border-gray-300'
 }`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="font-medium tracking-wide text-sm">{company.company}</span>
 {company.sanctionedOwner && (
 <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded font-bold">SANCTIONED OWNER</span>
 )}
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs px-2 py-0.5 bg-gray-200 rounded mono">{company.ownershipType}</span>
 <span className={`mono tracking-wide font-bold text-sm ${
 company.ownershipPercent >= 50 ? 'text-red-600' :
 company.ownershipPercent >= 25 ? 'text-rose-500' :
 'text-gray-700'
 }`}>
 {company.ownershipPercent > 0 ? `${company.ownershipPercent}%` : company.ownershipType}
 </span>
 </div>
 </div>
 {company.ownerDetails && (
 <div className="mt-2 text-xs text-gray-500">
 Sanctioned: {company.ownerDetails.lists.join(', ')} ({company.ownerDetails.listingDate})
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Beneficial Ownership (for organizations) */}
 {selectedEntity.type === 'ORGANIZATION' && selectedEntity.beneficialOwners && selectedEntity.beneficialOwners.length > 0 && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Users className="w-4 h-4" />
 Beneficial Ownership Structure
 </h4>
 <div className="space-y-2">
 {selectedEntity.beneficialOwners.map((owner, idx) => (
 <div key={idx} className={`p-5 rounded-lg border ${
 owner.sanctionStatus === 'SANCTIONED' ? 'bg-red-600/10 border-red-600/50' :
 'bg-gray-100/50 border-gray-300'
 }`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="font-medium tracking-wide">{owner.name}</span>
 {owner.sanctionStatus === 'SANCTIONED' && (
 <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded font-bold">SANCTIONED</span>
 )}
 </div>
 <span className={`mono tracking-wide font-bold ${
 owner.sanctionStatus === 'SANCTIONED' ? 'text-red-600' : 'text-gray-700'
 }`}>
 {owner.percent}%
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Corporate Network (for organizations with related entities) */}
 {selectedEntity.type === 'ORGANIZATION' && selectedEntity.corporateNetwork && selectedEntity.corporateNetwork.length > 0 && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Network className="w-4 h-4" />
 Corporate Network ({selectedEntity.corporateNetwork.length} Related {selectedEntity.corporateNetwork.length === 1 ? 'Entity' : 'Entities'})
 </h4>
 <div className="space-y-2">
 {selectedEntity.corporateNetwork.map((related, idx) => (
 <div key={idx} className={`p-5 rounded-lg border ${
 related.sanctionExposure === 'DIRECT' ? 'bg-red-600/10 border-red-600/30' :
 related.sanctionExposure === 'INDIRECT' ? 'bg-rose-500/10 border-rose-500/30' :
 'bg-gray-100/50 border-gray-300'
 }`}>
 <div className="flex items-center justify-between mb-1">
 <div className="flex items-center gap-2">
 <span className="text-xs px-2 py-0.5 bg-gray-200 rounded mono tracking-wide">{related.relationship}</span>
 <span className="font-medium tracking-wide text-sm">{related.entity}</span>
 </div>
 {related.sanctionExposure !== 'NONE' && (
 <span className={`text-xs px-2 py-0.5 rounded ${
 related.sanctionExposure === 'DIRECT' ? 'bg-red-600/20 text-red-600' : 'bg-rose-50 border border-rose-200 text-rose-600'
 }`}>
 {related.sanctionExposure} EXPOSURE
 </span>
 )}
 </div>
 <div className="text-xs text-gray-500">
 Common Owner: <span className="text-gray-600">{related.commonOwner}</span>
 {related.ownershipPercent > 0 && (
 <span className="ml-2">({related.ownershipPercent}%)</span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {selectedEntity.riskIndicators && selectedEntity.riskIndicators.length > 0 && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-500" />
 Risk Indicators
 </h4>
 <div className="space-y-2">
 {selectedEntity.riskIndicators.map((indicator, idx) => (
 <div key={idx} className="flex items-start gap-2 bg-amber-500/10 p-5 rounded-lg">
 <FileWarning className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 <span className="text-sm">{indicator}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {selectedEntity.citations && selectedEntity.citations.length > 0 && (
 <div>
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <BookOpen className="w-4 h-4 text-amber-500" />
 Evidence Citations
 </h4>
 <div className="space-y-2">
 {selectedEntity.citations.map((citation, idx) => (
 <div key={idx} className="flex items-start gap-2 bg-gray-100 p-5 rounded-lg">
 <Link2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 <span className="text-sm text-gray-600 leading-relaxed">{citation}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
 <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500">Select an entity to view details</p>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Typologies Tab */}
 {activeTab === 'typologies' && (
 <div className="space-y-4">
 {analysis.typologies && analysis.typologies.length > 0 ? (
 analysis.typologies.map((typology, idx) => (
 <div
 key={typology.id || idx}
 className={`bg-white border-l-4 ${getRiskBorder(typology.riskLevel)} rounded-xl p-6`}
 >
 <div className="flex items-start justify-between gap-4 mb-4">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <h3 className="text-lg font-semibold leading-tight">{typology.name}</h3>
 <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${getRiskColor(typology.riskLevel)}`}>
 {typology.riskLevel}
 </span>
 </div>
 <span className="text-xs px-2 py-1 bg-gray-100 rounded mono tracking-wide text-gray-600">
 {typology.category?.replace(/_/g, ' ')}
 </span>
 </div>
 </div>

 <p className="text-gray-600 mb-4">{typology.description}</p>

 {/* Indicators */}
 {typology.indicators && typology.indicators.length > 0 && (
 <div className="mb-4">
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-500" />
 Indicators Found
 </h4>
 <ul className="space-y-1">
 {typology.indicators.map((indicator, i) => (
 <li key={i} className="text-base text-gray-900 leading-relaxed flex items-start gap-2">
 <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 {indicator}
 </li>
 ))}
 </ul>
 </div>
 )}

 {/* Red Flags */}
 {typology.redFlags && typology.redFlags.length > 0 && (
 <div className="mb-4">
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Flag className="w-4 h-4 text-rose-500" />
 Red Flags
 </h4>
 <ul className="space-y-1">
 {typology.redFlags.map((flag, i) => (
 <li key={i} className="text-sm text-rose-600 flex items-start gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
 {flag}
 </li>
 ))}
 </ul>
 </div>
 )}

 {/* Entities Involved */}
 {typology.entitiesInvolved && typology.entitiesInvolved.length > 0 && (
 <div className="mb-4">
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Users className="w-4 h-4" />
 Entities Involved
 </h4>
 <div className="flex flex-wrap gap-2">
 {typology.entitiesInvolved.map((entityId, i) => {
 const entity = analysis.entities?.find(e => e.id === entityId);
 return (
 <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-base text-gray-900 leading-relaxed">
 {entity?.name || entityId}
 </span>
 );
 })}
 </div>
 </div>
 )}

 {/* Regulatory Relevance */}
 {typology.regulatoryRelevance && (
 <div className="mt-4 pt-4 border-t border-gray-200">
 <h4 className="text-sm font-medium tracking-wide text-base text-gray-600 leading-relaxed mb-2 flex items-center gap-2">
 <Scale className="w-4 h-4 text-blue-500" />
 Regulatory Relevance
 </h4>
 <p className="text-sm text-blue-600">{typology.regulatoryRelevance}</p>
 </div>
 )}
 </div>
 ))
 ) : (
 <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
 <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <h3 className="text-lg font-semibold leading-tight mb-2">No Typologies Identified</h3>
 <p className="text-gray-600">No specific financial crime typologies were detected in the evidence.</p>
 </div>
 )}
 </div>
 )}

 {/* Hypotheses Tab */}
 {activeTab === 'hypotheses' && (
 <div className="space-y-4">
 {analysis.hypotheses?.map((hypothesis, idx) => (
 <div
 key={hypothesis.id || idx}
 className="bg-white border border-gray-200 rounded-xl overflow-hidden"
 >
 <button
 onClick={() => setExpandedHypotheses(prev => ({
 ...prev,
 [hypothesis.id || idx]: !prev[hypothesis.id || idx]
 }))}
 className="w-full p-6 text-left flex items-center gap-4"
 >
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <Lightbulb className="w-5 h-5 text-amber-500" />
 <h3 className="text-lg font-semibold leading-tight">{hypothesis.title}</h3>
 </div>
 <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{hypothesis.description}</p>
 </div>
 
 <div className="flex items-center gap-4">
 {/* Confidence meter */}
 <div className="text-right">
 <p className="text-xs font-medium text-gray-500 mono uppercase tracking-wider mb-1">CONFIDENCE</p>
 <div className="flex items-center gap-2">
 <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
 <div 
 className="h-full confidence-bar rounded-full transition-all"
 style={{ width: `${(hypothesis.confidence || 0) * 100}%` }}
 />
 </div>
 <span className="mono text-sm tracking-wide font-bold">
 {Math.round((hypothesis.confidence || 0) * 100)}%
 </span>
 </div>
 </div>
 
 {expandedHypotheses[hypothesis.id || idx] 
 ? <ChevronDown className="w-5 h-5 text-gray-500" />
 : <ChevronRight className="w-5 h-5 text-gray-500" />
 }
 </div>
 </button>

 {expandedHypotheses[hypothesis.id || idx] && (
 <div className="px-6 pb-6 border-t border-gray-200 pt-4 fade-in">
 <div className="grid md:grid-cols-3 gap-6">
 {/* Supporting Evidence */}
 <div>
 <h4 className="text-sm font-medium tracking-wide text-emerald-600 mb-3 flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4" />
 Supporting Evidence
 </h4>
 <div className="space-y-2">
 {hypothesis.supportingEvidence?.map((evidence, eidx) => (
 <div key={eidx} className="text-sm bg-emerald-500/10 p-5 rounded-lg">
 {evidence}
 </div>
 ))}
 </div>
 </div>

 {/* Contradicting Evidence */}
 <div>
 <h4 className="text-sm font-medium tracking-wide text-rose-600 mb-3 flex items-center gap-2">
 <XCircle className="w-4 h-4" />
 Contradicting Evidence
 </h4>
 <div className="space-y-2">
 {hypothesis.contradictingEvidence?.map((evidence, eidx) => (
 <div key={eidx} className="text-sm bg-rose-500/10 p-5 rounded-lg">
 {evidence}
 </div>
 )) || <p className="text-sm text-gray-500 leading-relaxed">None identified</p>}
 </div>
 </div>

 {/* Investigative Gaps */}
 <div>
 <h4 className="text-sm font-medium tracking-wide text-amber-600 mb-3 flex items-center gap-2">
 <HelpCircle className="w-4 h-4" />
 Investigative Gaps
 </h4>
 <div className="space-y-2">
 {hypothesis.investigativeGaps?.map((gap, gidx) => (
 <div key={gidx} className="text-sm bg-amber-500/10 p-5 rounded-lg">
 {gap}
 </div>
 )) || <p className="text-sm text-gray-500 leading-relaxed">None identified</p>}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 )}

 {/* Network Tab */}
 {activeTab === 'network' && (
 <div className="space-y-6">
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
 <Network className="w-6 h-6 text-amber-500" />
 Entity Relationship Network
 </h2>
 <p className="text-sm text-gray-600 mb-6">
 Visual representation of all entities and their relationships. Click on any node to select the entity.
 </p>

 <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
 <ForceGraph2D
 graphData={(() => {
 const nodes = [];
 const links = [];
 const nodeIdMap = new Map();

 // Add entity nodes
 if (analysis.entities) {
 analysis.entities.forEach(entity => {
 nodes.push({
 id: entity.id,
 name: entity.name,
 type: entity.type,
 riskLevel: entity.riskLevel || 'LOW',
 sanctionStatus: entity.sanctionStatus,
 role: entity.role
 });
 nodeIdMap.set(entity.name?.toLowerCase(), entity.id);
 });
 }

 const validNodeIds = new Set(nodes.map(n => n.id));

 // Add explicit relationships
 if (analysis.relationships) {
 analysis.relationships.forEach(rel => {
 // Support both old format (from/to) and new format (entity1/entity2)
 const entity1 = rel.from || rel.entity1;
 const entity2 = rel.to || rel.entity2;
 const relType = rel.type || rel.relationshipType || 'connected to';

 // Try to match by ID first, then by name
 let sourceId = validNodeIds.has(entity1) ? entity1 : nodeIdMap.get(entity1?.toLowerCase());
 let targetId = validNodeIds.has(entity2) ? entity2 : nodeIdMap.get(entity2?.toLowerCase());

 if (sourceId && targetId && validNodeIds.has(sourceId) && validNodeIds.has(targetId)) {
 links.push({
 source: sourceId,
 target: targetId,
 relationship: relType + (rel.percentage ? ` (${rel.percentage}%)` : ''),
 description: rel.description,
 strength: relType?.includes('owns') || relType?.includes('control') || rel.percentage >= 50 ? 3 : 1
 });
 }
 });
 }

 // Add ownership connections from entity data
 if (analysis.entities) {
 analysis.entities.forEach(entity => {
 // Ownership links
 if (entity.ownedCompanies?.length > 0) {
 entity.ownedCompanies.forEach(company => {
 const targetId = nodeIdMap.get(company.company?.toLowerCase());
 if (targetId && validNodeIds.has(entity.id)) {
 links.push({
 source: entity.id,
 target: targetId,
 relationship: `owns ${company.ownershipPercent}%`,
 description: `Ownership: ${company.ownershipPercent}%`,
 strength: company.ownershipPercent >= 50 ? 4 : 2,
 isOwnership: true
 });
 }
 });
 }

 // Beneficial ownership
 if (entity.beneficialOwners?.length > 0) {
 entity.beneficialOwners.forEach(owner => {
 const sourceId = nodeIdMap.get(owner.name?.toLowerCase());
 if (sourceId && validNodeIds.has(entity.id)) {
 const pct = owner.ownershipPercent || owner.percent || 0;
 links.push({
 source: sourceId,
 target: entity.id,
 relationship: `owns ${pct}%`,
 description: `Beneficial owner: ${pct}%`,
 strength: pct >= 50 ? 4 : 2,
 sanctioned: owner.sanctionStatus === 'MATCH'
 });
 }
 });
 }

 // Corporate network connections
 if (entity.corporateNetwork?.length > 0) {
 entity.corporateNetwork.forEach(related => {
 const targetId = nodeIdMap.get(related.entity?.toLowerCase());
 if (targetId && validNodeIds.has(entity.id) && validNodeIds.has(targetId)) {
 links.push({
 source: entity.id,
 target: targetId,
 relationship: related.relationship || 'related to',
 description: `Common owner: ${related.commonOwner || 'Unknown'}`,
 strength: related.sanctionExposure === 'DIRECT' ? 4 : 2,
 sanctioned: related.sanctionExposure === 'DIRECT'
 });
 }
 });
 }
 });
 }

 // Add connections from ownershipChains if available
 if (analysis.ownershipChains) {
 analysis.ownershipChains.forEach(chain => {
 const ownerId = nodeIdMap.get(chain.ultimateBeneficialOwner?.toLowerCase());
 const entityId = nodeIdMap.get(chain.controlledEntity?.toLowerCase());
 if (ownerId && entityId && validNodeIds.has(ownerId) && validNodeIds.has(entityId)) {
 links.push({
 source: ownerId,
 target: entityId,
 relationship: `controls ${chain.ownershipPercent}%`,
 description: chain.chain || `Ownership: ${chain.ownershipPercent}%`,
 strength: chain.ownershipPercent >= 50 ? 4 : 2,
 isOwnership: true
 });
 }
 });
 }

 // Remove duplicates
 const linkMap = new Map();
 links.forEach(link => {
 const key = `${link.source}-${link.target}`;
 if (!linkMap.has(key) || link.strength > linkMap.get(key).strength) {
 linkMap.set(key, link);
 }
 });

 return { nodes, links: Array.from(linkMap.values()) };
 })()}
 nodeLabel={node => `${node.name}\n${node.type}\nRisk: ${node.riskLevel}`}
 nodeColor={node => {
 if (node.sanctionStatus === 'MATCH') return '#dc2626';
 if (node.riskLevel === 'CRITICAL') return '#dc2626';
 if (node.riskLevel === 'HIGH') return '#f43f5e';
 if (node.riskLevel === 'MEDIUM') return '#f59e0b';
 return '#10b981';
 }}
 nodeVal={node => {
 if (node.sanctionStatus === 'MATCH') return 6;
 if (node.riskLevel === 'CRITICAL') return 5;
 if (node.riskLevel === 'HIGH') return 4;
 if (node.riskLevel === 'MEDIUM') return 3;
 return 2;
 }}
 linkLabel={link => link.relationship || link.description}
 linkDirectionalArrowLength={4}
 linkDirectionalArrowRelPos={1}
 linkColor={link => {
 if (link.sanctioned) return '#dc2626';
 if (link.isOwnership && link.strength >= 4) return '#f59e0b';
 if (link.isOwnership) return '#06b6d4';
 return '#6b7280';
 }}
 linkWidth={link => link.strength || 1}
 linkDirectionalParticles={link => link.strength >= 3 ? 1 : 0}
 linkDirectionalParticleWidth={2}
 backgroundColor="#f9fafb"
 nodeCanvasObject={(node, ctx, globalScale) => {
 const label = node.name;
 const fontSize = 10/globalScale;
 ctx.font = `${fontSize}px Sans-Serif`;
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';

 // Draw node circle
 const nodeRadius = Math.sqrt(node.riskLevel === 'CRITICAL' ? 5 : node.riskLevel === 'HIGH' ? 4 : node.riskLevel === 'MEDIUM' ? 3 : 2) * 1.5;
 ctx.beginPath();
 ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
 ctx.fillStyle = node.sanctionStatus === 'MATCH' ? '#dc2626' :
 node.riskLevel === 'CRITICAL' ? '#dc2626' :
 node.riskLevel === 'HIGH' ? '#f43f5e' :
 node.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981';
 ctx.fill();

 // Draw label
 ctx.fillStyle = '#111827';
 ctx.fillText(label, node.x, node.y + nodeRadius + 6);
 }}
 onNodeClick={(node) => {
 setSelectedEntity(node.id);
 setActiveTab('entities');
 }}
 cooldownTicks={100}
 onEngineStop={() => {}}
 />
 </div>

 {/* Legend */}
 <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-red-600"></div>
 <span className="text-sm text-gray-700">Critical Risk</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-rose-500"></div>
 <span className="text-sm text-gray-700">High Risk</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
 <span className="text-sm text-gray-700">Medium Risk</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
 <span className="text-sm text-gray-700">Low Risk</span>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Evidence Tab */}
 {activeTab === 'evidence' && (
 <div className="space-y-6">
 {/* Add More Evidence Section */}
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-semibold leading-tight flex items-center gap-2">
 <Upload className="w-5 h-5 text-amber-500" />
 Add More Evidence
 </h3>
 {files.length > (activeCase?.files?.length || 0) && (
 <button
 onClick={analyzeEvidence}
 disabled={isAnalyzing}
 className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-lg font-medium tracking-wide transition-colors disabled:opacity-50"
 >
 {isAnalyzing ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Zap className="w-4 h-4" />
 )}
 Re-analyze with New Evidence
 </button>
 )}
 </div>
 
 <div
 onDragEnter={handleDrag}
 onDragLeave={handleDrag}
 onDragOver={handleDrag}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current?.click()}
 className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
 dragActive 
 ? 'border-amber-500 bg-amber-500/10' 
 : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100/50'
 }`}
 >
 <input
 ref={fileInputRef}
 type="file"
 multiple
 onChange={handleFileInput}
 className="hidden"
 accept=".txt,.pdf,.doc,.docx,.csv,.json,.xml"
 />
 <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-amber-500' : 'text-gray-400'}`} />
 <p className="text-base text-gray-600 leading-relaxed mb-1">
 Drop additional files here or click to browse
 </p>
 <p className="text-xs text-gray-400">
 TXT, PDF, DOC, DOCX, CSV, JSON, XML supported
 </p>
 </div>
 
 {files.length > (activeCase?.files?.length || 0) && (
 <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
 <p className="text-sm text-amber-600 flex items-center gap-2">
 <AlertTriangle className="w-4 h-4" />
 {files.length - (activeCase?.files?.length || 0)} new file(s) added. Click "Re-analyze with New Evidence" to update the analysis.
 </p>
 </div>
 )}
 </div>

 {/* Source Documents */}
 <div className="bg-white border border-gray-200 rounded-xl p-8">
 <h3 className="text-lg font-semibold leading-tight mb-4 flex items-center gap-2">
 <FileText className="w-5 h-5 text-amber-500" />
 Source Documents ({files.length})
 </h3>
 <div className="space-y-4">
 {files.map((file, idx) => (
 <div key={file.id} className="border border-gray-300 rounded-lg overflow-hidden">
 <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <span className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center mono tracking-wide text-amber-500 text-sm font-bold">
 {idx + 1}
 </span>
 <div>
 <p className="font-medium tracking-wide">{file.name}</p>
 <p className="text-xs text-gray-500 mono tracking-wide">
 {(file.size / 1024).toFixed(1)} KB • Uploaded {new Date(file.uploadedAt).toLocaleString()}
 </p>
 </div>
 </div>
 <button
 onClick={() => removeFile(file.id)}
 className="p-2 text-gray-500 hover:text-rose-600 hover:bg-gray-200 rounded-lg transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 <div className="p-4 bg-white/50">
 <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
 {file.content}
 </pre>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </>
 )}

 </main>

 {/* Chat Panel - Only visible when analysis is complete */}
 {(currentPage === 'newCase' || currentPage === 'activeCase') && analysis && (
 <>
 {/* Chat Toggle Button */}
 {!chatOpen && (
 <button
 onClick={() => setChatOpen(true)}
 className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 glow-amber z-50 group"
 >
 <MessageCircle className="w-6 h-6 text-gray-900" />
 <span className="absolute right-full mr-3 bg-gray-100 text-gray-900 text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
 Ask Marlowe
 </span>
 </button>
 )}

 {/* Chat Window */}
 {chatOpen && (
 <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white border border-gray-300 rounded-2xl shadow-2xl flex flex-col z-50 fade-in overflow-hidden">
 {/* Chat Header */}
 <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-300">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
 <MessageCircle className="w-4 h-4 text-gray-900" />
 </div>
 <div>
 <p className="font-semibold tracking-wide text-sm">Ask Marlowe</p>
 <p className="text-xs text-gray-500">Investigative Assistant</p>
 </div>
 </div>
 <button
 onClick={() => setChatOpen(false)}
 className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
 >
 <Minimize2 className="w-4 h-4 text-gray-600" />
 </button>
 </div>

 {/* Chat Messages */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 {chatMessages.length === 0 && (
 <div className="text-center py-8">
 <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Shield className="w-6 h-6 text-amber-500" />
 </div>
 <p className="text-gray-600 text-sm mb-4">
 Ask me anything about this case
 </p>
 <div className="space-y-2">
 {[
 "Who are the key suspects?",
 "What's the strongest evidence?",
 "Are there any gaps in the timeline?",
 "What should I investigate next?"
 ].map((suggestion, idx) => (
 <button
 key={idx}
 onClick={() => {
 setChatInput(suggestion);
 }}
 className="block w-full text-left text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-600 transition-colors"
 >
 {suggestion}
 </button>
 ))}
 </div>
 </div>
 )}

 {chatMessages.map((msg, idx) => (
 <div
 key={idx}
 className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
 >
 <div
 className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
 msg.role === 'user'
 ? 'bg-amber-500 text-gray-900'
 : 'bg-gray-100 text-gray-800'
 }`}
 >
 <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
 </div>
 </div>
 ))}

 {isChatLoading && (
 <div className="flex justify-start">
 <div className="bg-gray-100 rounded-2xl px-4 py-3">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
 <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
 <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
 </div>
 </div>
 </div>
 )}

 <div ref={chatEndRef} />
 </div>

 {/* Chat Input */}
 <div className="p-3 border-t border-gray-300">
 <div className="flex items-center gap-2">
 <input
 type="text"
 value={chatInput}
 onChange={(e) => setChatInput(e.target.value)}
 onKeyPress={handleChatKeyPress}
 placeholder="Ask about the case..."
 className="flex-1 bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder-gray-400"
 />
 <button
 onClick={sendChatMessage}
 disabled={!chatInput.trim() || isChatLoading}
 className="w-10 h-10 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-300 rounded-xl flex items-center justify-center transition-colors"
 >
 <Send className="w-4 h-4 text-gray-900" />
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 )}

 {/* KYC Chat - Fixed Position (only shows on KYC results page) */}
 {currentPage === 'kycScreening' && kycPage === 'results' && kycResults && (
 <>
 {/* KYC Chat Floating Button */}
 {!kycChatOpen && (
 <button
 onClick={() => setKycChatOpen(true)}
 className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 z-40"
 >
 <MessageCircle className="w-6 h-6 text-gray-900" />
 </button>
 )}

 {/* KYC Chat Panel */}
 {kycChatOpen && (
 <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white border border-gray-300 rounded-2xl shadow-2xl flex flex-col z-50 fade-in overflow-hidden">
 {/* Chat Header */}
 <div className="flex items-center justify-between p-4 border-b border-gray-200">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
 <MessageCircle className="w-5 h-5 text-emerald-500" />
 </div>
 <div>
 <h3 className="font-semibold">Scout Assistant</h3>
 <p className="text-xs text-gray-500">Ask about the screening</p>
 </div>
 </div>
 <button
 onClick={() => setKycChatOpen(false)}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <Minimize2 className="w-5 h-5 text-gray-600" />
 </button>
 </div>

 {/* Chat Messages */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 {kycChatMessages.length === 0 && (
 <div className="text-center py-8">
 <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
 <p className="text-gray-600 text-sm mb-4">
 Ask questions about this screening
 </p>
 <div className="space-y-2">
 {[
 "What are the main risk factors?",
 "Explain the sanctions findings",
 "What due diligence is recommended?",
 "Are there any ownership concerns?"
 ].map((suggestion, idx) => (
 <button
 key={idx}
 onClick={() => {
 setKycChatInput(suggestion);
 }}
 className="block w-full text-left text-xs bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 text-gray-600 transition-colors"
 >
 {suggestion}
 </button>
 ))}
 </div>
 </div>
 )}
 
 {kycChatMessages.map((msg, idx) => (
 <div
 key={idx}
 className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
 >
 <div
 className={`max-w-[80%] rounded-2xl px-4 py-3 ${
 msg.role === 'user'
 ? 'bg-emerald-500 text-gray-900'
 : 'bg-gray-100 text-gray-800'
 }`}
 >
 <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
 </div>
 </div>
 ))}
 
 {isKycChatLoading && (
 <div className="flex justify-start">
 <div className="bg-gray-100 rounded-2xl px-4 py-3">
 <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
 </div>
 </div>
 )}
 
 <div ref={kycChatEndRef} />
 </div>

 {/* Chat Input */}
 <div className="p-4 border-t border-gray-200">
 <div className="flex gap-2">
 <input
 type="text"
 value={kycChatInput}
 onChange={(e) => setKycChatInput(e.target.value)}
 onKeyPress={(e) => e.key === 'Enter' && sendKycChatMessage()}
 placeholder="Ask about this screening..."
 className="flex-1 bg-gray-100 border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
 />
 <button
 onClick={sendKycChatMessage}
 disabled={!kycChatInput.trim() || isKycChatLoading}
 className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-300 text-gray-900 disabled:text-gray-500 p-2 rounded-xl transition-colors"
 >
 <Send className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 )}

 {/* Floating Results Ready Notification - shows when on other pages */}
 {backgroundAnalysis.isComplete && currentPage !== 'newCase' && (
   <div className="fixed bottom-20 right-6 z-50 animate-slideUp">
     <div className="bg-white border border-emerald-200 rounded-xl shadow-xl p-4 max-w-sm">
       <div className="flex items-start gap-3">
         <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
           <CheckCircle2 className="w-5 h-5 text-emerald-600" />
         </div>
         <div className="flex-1 min-w-0">
           <h4 className="font-semibold text-gray-900 text-sm">Analysis Complete</h4>
           <p className="text-xs text-gray-500 truncate">{backgroundAnalysis.caseName}</p>
         </div>
         <button
           onClick={() => setBackgroundAnalysis(prev => ({ ...prev, isComplete: false, pendingAnalysis: null }))}
           className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
         >
           <X className="w-4 h-4 text-gray-400" />
         </button>
       </div>
       <button
         onClick={() => {
           viewAnalysisResults();
           setCurrentPage('newCase');
         }}
         className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
       >
         <Eye className="w-4 h-4" />
         View Results
       </button>
     </div>
   </div>
 )}

 {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm py-4 text-center text-xs text-gray-400 leading-relaxed">
 <p className="mono tracking-wide">MARLOWE INVESTIGATIVE INTELLIGENCE PLATFORM • MVP v1.0</p>
 </footer>
 </div>
 );
}
