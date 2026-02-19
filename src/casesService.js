// casesService.js - Supabase Case Management Operations
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Fetch all cases for a workspace (filtered by email domain or user email)
 * @param {string} workspaceId - The email domain for workspace filtering
 * @param {string} userEmail - The user's email for personal case filtering
 */
export const fetchUserCases = async (workspaceId, userEmail) => {
  if (!isSupabaseConfigured()) {
    console.log('[Cases] Supabase not configured, using local storage');
    return { data: null, error: null };
  }

  try {
    // Use OR filter to match cases by either email_domain or created_by_email
    // This handles cases where email_domain might be empty but created_by_email is set
    let query = supabase
      .from('cases')
      .select('*')
      .order('updated_at', { ascending: false });

    if (workspaceId && userEmail) {
      // Filter by workspace OR user email (handles both cases)
      console.log('[Cases] Filtering by email_domain:', workspaceId, 'OR created_by_email:', userEmail);
      query = query.or(`email_domain.eq.${workspaceId},created_by_email.eq.${userEmail}`);
    } else if (workspaceId) {
      console.log('[Cases] Filtering by email_domain:', workspaceId);
      query = query.eq('email_domain', workspaceId);
    } else if (userEmail) {
      console.log('[Cases] Filtering by created_by_email:', userEmail);
      query = query.eq('created_by_email', userEmail);
    } else {
      console.log('[Cases] No filter provided, fetching all cases');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Cases] Database query error:', error);
      throw error;
    }

    // Transform Supabase data to match app format
    const cases = data?.map(transformFromSupabase) || [];
    console.log(`[Cases] Fetched ${cases.length} cases from database`);
    return { data: cases, error: null };
  } catch (error) {
    console.error('[Cases] Error fetching cases:', error);
    return { data: null, error };
  }
};

/**
 * Create a new case
 */
export const createCase = async (caseData) => {
  if (!isSupabaseConfigured()) {
    console.log('[Cases] Supabase not configured, skipping database save');
    return { data: null, error: null };
  }

  try {
    const supabaseData = {
      ...transformToSupabase(caseData),
      id: caseData.id,
    };

    console.log('[Cases] Creating case in database:', {
      id: caseData.id,
      name: caseData.name,
      email_domain: supabaseData.email_domain,
      created_by_email: supabaseData.created_by_email
    });

    const { data, error } = await supabase
      .from('cases')
      .insert([supabaseData])
      .select()
      .single();

    if (error) {
      // If columns are missing, retry without workflow fields
      if (isMissingColumnError(error) && dbHasWorkflowColumns !== false) {
        console.warn('[Cases] Workflow columns missing, retrying without them');
        dbHasWorkflowColumns = false;
        const baseData = { ...transformToSupabase(caseData, false), id: caseData.id };
        const { data: retryData, error: retryError } = await supabase
          .from('cases')
          .insert([baseData])
          .select()
          .single();
        if (retryError) throw retryError;
        console.log('[Cases] Case created successfully (without workflow):', retryData.id);
        return { data: transformFromSupabase(retryData), error: null };
      }
      throw error;
    }

    dbHasWorkflowColumns = true;
    console.log('[Cases] Case created successfully:', data.id);
    return { data: transformFromSupabase(data), error: null };
  } catch (error) {
    console.error('[Cases] Error creating case:', error);
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
      conversation_transcript: updates.conversationTranscript || [],
      documents: updates.documents || [],
      files: updates.files || [],
      analysis_data: updates.analysis || updates.analysisData || {},
      screenings: updates.screenings || [],
      pdf_reports: updates.pdfReports || [],
      network_artifacts: updates.networkArtifacts || [],
      monitoring_enabled: updates.monitoringEnabled || false,
      monitoring_last_run: updates.monitoringLastRun || null,
      monitoring_alerts: updates.monitoringAlerts || [],
      email_domain: updates.emailDomain || '',
      created_by_email: updates.createdByEmail || '',
      updated_at: new Date().toISOString(),
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
    const supabaseData = {
      ...transformToSupabase(caseData),
      id: caseData.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cases')
      .upsert([supabaseData], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      if (isMissingColumnError(error) && dbHasWorkflowColumns !== false) {
        console.warn('[Cases] Workflow columns missing, retrying sync without them');
        dbHasWorkflowColumns = false;
        const baseData = { ...transformToSupabase(caseData, false), id: caseData.id, updated_at: new Date().toISOString() };
        const { data: retryData, error: retryError } = await supabase
          .from('cases')
          .upsert([baseData], { onConflict: 'id' })
          .select()
          .single();
        if (retryError) throw retryError;
        return { data: transformFromSupabase(retryData), error: null };
      }
      throw error;
    }

    if (dbHasWorkflowColumns === null) dbHasWorkflowColumns = true;
    return { data: transformFromSupabase(data), error: null };
  } catch (error) {
    console.error('[Cases] Error syncing case:', error);
    return { data: null, error };
  }
};

/**
 * Cache whether the DB has workflow columns (auto-detected on first write)
 * null = unknown, true = columns exist, false = columns missing
 */
let dbHasWorkflowColumns = null;

/**
 * Transform app case format to Supabase format
 */
const transformToSupabase = (caseData, includeWorkflow = true) => {
  // Only include columns that exist in the actual DB schema
  const base = {
    name: caseData.name,
    description: caseData.description || '',
    risk_level: caseData.riskLevel || 'UNKNOWN',
    status: caseData.status || 'active',
    chat_history: caseData.chatHistory || [],
    conversation_transcript: caseData.conversationTranscript || [],
    documents: caseData.documents || [],
    files: caseData.files || [],
    analysis_data: caseData.analysis || caseData.analysisData || {},
    screenings: caseData.screenings || [],
    pdf_reports: caseData.pdfReports || [],
    network_artifacts: caseData.networkArtifacts || [],
    monitoring_enabled: caseData.monitoringEnabled || false,
    monitoring_last_run: caseData.monitoringLastRun || null,
    monitoring_alerts: caseData.monitoringAlerts || [],
    email_domain: caseData.emailDomain || '',
    created_by_email: caseData.createdByEmail || '',
  };

  if (includeWorkflow && dbHasWorkflowColumns !== false) {
    base.workflow_status = caseData.workflowStatus || 'new';
    base.assigned_to = caseData.assignedTo || null;
    base.reviewed_by = caseData.reviewedBy || null;
    base.escalated_by = caseData.escalatedBy || null;
    base.escalation_reason = caseData.escalationReason || null;
    base.review_decision = caseData.reviewDecision || null;
    base.review_notes = caseData.reviewNotes || null;
    base.due_date = caseData.dueDate || null;
    base.priority = caseData.priority || 'medium';
  }

  return base;
};

/**
 * Check if a Supabase error is due to missing columns
 */
const isMissingColumnError = (error) =>
  error?.code === 'PGRST204' || (error?.message || '').includes('column');

/**
 * Transform Supabase format to app case format
 */
const transformFromSupabase = (data) => ({
  id: data.id,
  name: data.name,
  description: data.description,
  riskLevel: data.risk_level || 'UNKNOWN',
  status: data.status,
  viewed: data.viewed || false,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  chatHistory: data.chat_history || [],
  conversationTranscript: data.conversation_transcript || [],
  documents: data.documents || [],
  files: data.files || [],
  analysis: data.analysis_data || {},
  analysisData: data.analysis_data || {},
  screenings: data.screenings || [],
  pdfReports: data.pdf_reports || [],
  networkArtifacts: data.network_artifacts || [],
  monitoringEnabled: data.monitoring_enabled || false,
  monitoringLastRun: data.monitoring_last_run || null,
  monitoringAlerts: data.monitoring_alerts || [],
  emailDomain: data.email_domain || '',
  createdByEmail: data.created_by_email || '',
  // Workflow fields (safe - just returns defaults if columns don't exist in DB)
  workflowStatus: data.workflow_status || 'new',
  assignedTo: data.assigned_to || null,
  reviewedBy: data.reviewed_by || null,
  escalatedBy: data.escalated_by || null,
  escalationReason: data.escalation_reason || null,
  reviewDecision: data.review_decision || null,
  reviewNotes: data.review_notes || null,
  dueDate: data.due_date || null,
  priority: data.priority || 'medium',
});

const casesService = {
  fetchUserCases,
  createCase,
  updateCase,
  deleteCase,
  syncCase,
};

export default casesService;
