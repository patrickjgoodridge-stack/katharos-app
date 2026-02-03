// casesService.js - Supabase Case Management Operations
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Fetch all cases for a workspace (filtered by email domain or user email)
 * @param {string} workspaceId - The email domain for workspace filtering
 * @param {string} userEmail - The user's email for personal case filtering
 */
export const fetchUserCases = async (workspaceId, userEmail) => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, using local storage');
    return { data: null, error: null };
  }

  try {
    let query = supabase
      .from('cases')
      .select('*')
      .order('updated_at', { ascending: false });

    // Filter by workspace (email domain) if provided
    if (workspaceId) {
      query = query.eq('email_domain', workspaceId);
    } else if (userEmail) {
      // Otherwise filter by user's email
      query = query.eq('created_by_email', userEmail);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform Supabase data to match app format
    const cases = data?.map(transformFromSupabase) || [];
    console.log(`[Cases] Loaded ${cases.length} cases from database`);
    return { data: cases, error: null };
  } catch (error) {
    console.error('Error fetching cases:', error);
    return { data: null, error };
  }
};

/**
 * Create a new case
 */
export const createCase = async (caseData) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    const supabaseData = transformToSupabase(caseData);

    const { data, error } = await supabase
      .from('cases')
      .insert([supabaseData])
      .select()
      .single();

    if (error) throw error;

    return { data: transformFromSupabase(data), error: null };
  } catch (error) {
    console.error('Error creating case:', error);
    return { data: null, error };
  }
};

/**
 * Update an existing case
 */
export const updateCase = async (caseId, updates) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    const supabaseUpdates = {
      name: updates.name,
      description: updates.description,
      risk_level: updates.riskLevel,
      status: updates.status,
      chat_history: updates.chatHistory || [],
      conversation_transcript: updates.conversationTranscript || [], // Full conversation
      documents: updates.documents || [],
      files: updates.files || [], // Uploaded files
      analysis_data: updates.analysis || updates.analysisData || {}, // Analysis results
      screenings: updates.screenings || [], // KYC screenings
      pdf_reports: updates.pdfReports || [],
      network_artifacts: updates.networkArtifacts || [],
      monitoring_enabled: updates.monitoringEnabled || false,
      monitoring_last_run: updates.monitoringLastRun || null,
      monitoring_alerts: updates.monitoringAlerts || [],
      email_domain: updates.emailDomain || '',
      created_by_email: updates.createdByEmail || '',
      updated_at: new Date().toISOString(), // Update timestamp
    };

    const { data, error } = await supabase
      .from('cases')
      .update(supabaseUpdates)
      .eq('id', caseId)
      .select()
      .single();

    if (error) throw error;

    return { data: transformFromSupabase(data), error: null };
  } catch (error) {
    console.error('Error updating case:', error);
    return { data: null, error };
  }
};

/**
 * Delete a case
 */
export const deleteCase = async (caseId) => {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting case:', error);
    return { error };
  }
};

/**
 * Sync local case to Supabase (upsert)
 */
export const syncCase = async (caseData) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    // Check if case exists in Supabase
    const { data: existing } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseData.id)
      .single();

    if (existing) {
      // Update existing case
      return await updateCase(caseData.id, caseData);
    } else {
      // Create new case with the same ID
      const supabaseData = transformToSupabase(caseData);

      const { data, error } = await supabase
        .from('cases')
        .insert([{ ...supabaseData, id: caseData.id }])
        .select()
        .single();

      if (error) throw error;

      return { data: transformFromSupabase(data), error: null };
    }
  } catch (error) {
    console.error('Error syncing case:', error);
    return { data: null, error };
  }
};

/**
 * Transform app case format to Supabase format
 */
const transformToSupabase = (caseData) => ({
  name: caseData.name,
  description: caseData.description || '',
  risk_level: caseData.riskLevel || 'UNKNOWN',
  status: caseData.status || 'active',
  chat_history: caseData.chatHistory || [],
  conversation_transcript: caseData.conversationTranscript || [], // Full conversation history
  documents: caseData.documents || [],
  files: caseData.files || [], // Uploaded files
  analysis_data: caseData.analysis || caseData.analysisData || {}, // Analysis results
  screenings: caseData.screenings || [], // KYC screening results
  pdf_reports: caseData.pdfReports || [],
  network_artifacts: caseData.networkArtifacts || [],
  monitoring_enabled: caseData.monitoringEnabled || false,
  monitoring_last_run: caseData.monitoringLastRun || null,
  monitoring_alerts: caseData.monitoringAlerts || [],
  email_domain: caseData.emailDomain || '',
  created_by_email: caseData.createdByEmail || '',
});

/**
 * Transform Supabase format to app case format
 */
const transformFromSupabase = (data) => ({
  id: data.id,
  name: data.name,
  description: data.description,
  riskLevel: data.risk_level || 'UNKNOWN',
  status: data.status,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  chatHistory: data.chat_history || [],
  conversationTranscript: data.conversation_transcript || [], // Full conversation history
  documents: data.documents || [],
  files: data.files || [], // Uploaded files
  analysis: data.analysis_data || {}, // Analysis results
  analysisData: data.analysis_data || {},
  screenings: data.screenings || [], // KYC screening results
  pdfReports: data.pdf_reports || [],
  networkArtifacts: data.network_artifacts || [],
  monitoringEnabled: data.monitoring_enabled || false,
  monitoringLastRun: data.monitoring_last_run || null,
  monitoringAlerts: data.monitoring_alerts || [],
  emailDomain: data.email_domain || '',
  createdByEmail: data.created_by_email || '',
});

const casesService = {
  fetchUserCases,
  createCase,
  updateCase,
  deleteCase,
  syncCase,
};

export default casesService;
