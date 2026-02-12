import { supabase, isSupabaseConfigured } from './supabaseClient';
import { logAudit } from './auditService';

const VALID_TRANSITIONS = {
  new: ['screening', 'closed'],
  screening: ['in_review', 'escalated', 'closed'],
  in_review: ['approved', 'rejected', 'escalated', 'closed'],
  escalated: ['in_review', 'approved', 'rejected', 'closed'],
  approved: ['closed'],
  rejected: ['in_review', 'closed'],
  closed: ['new'],
};

export const WORKFLOW_STATUSES = {
  new: { label: 'New', color: '#9e9e9e' },
  screening: { label: 'Screening', color: '#2196f3' },
  in_review: { label: 'In Review', color: '#ff9800' },
  escalated: { label: 'Escalated', color: '#f44336' },
  approved: { label: 'Approved', color: '#4caf50' },
  rejected: { label: 'Rejected', color: '#e53935' },
  closed: { label: 'Closed', color: '#757575' },
};

export const PRIORITIES = {
  low: { label: 'Low', color: '#9e9e9e' },
  medium: { label: 'Medium', color: '#ff9800' },
  high: { label: 'High', color: '#f44336' },
  urgent: { label: 'Urgent', color: '#d32f2f' },
};

export const canTransition = (fromStatus, toStatus) => {
  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
};

export const getValidTransitions = (fromStatus) => {
  return VALID_TRANSITIONS[fromStatus] || [];
};

export const transitionCase = async (caseId, newStatus, { userEmail, userName, comment } = {}) => {
  if (!isSupabaseConfigured()) return { error: 'Not configured' };

  try {
    // Fetch current case
    const { data: current, error: fetchErr } = await supabase
      .from('cases')
      .select('workflow_status')
      .eq('id', caseId)
      .single();
    if (fetchErr) throw fetchErr;

    const fromStatus = current.workflow_status || 'new';
    if (!canTransition(fromStatus, newStatus)) {
      return { error: `Cannot transition from ${fromStatus} to ${newStatus}` };
    }

    // Update case
    const updates = { workflow_status: newStatus };
    if (newStatus === 'approved' || newStatus === 'rejected') {
      updates.reviewed_by = userEmail;
      updates.review_decision = newStatus;
    }

    const { error: updateErr } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', caseId);
    if (updateErr) throw updateErr;

    // Insert activity
    await supabase.from('case_activities').insert([{
      case_id: caseId,
      user_email: userEmail || '',
      user_name: userName || '',
      activity_type: 'status_change',
      from_value: fromStatus,
      to_value: newStatus,
      comment: comment || null,
    }]);

    // Audit log
    logAudit('case_updated', { entityType: 'case', entityId: caseId, details: { action: 'status_change', from: fromStatus, to: newStatus } });

    return { data: { workflow_status: newStatus }, error: null };
  } catch (error) {
    console.error('[Workflow] Transition error:', error);
    return { data: null, error };
  }
};

export const assignCase = async (caseId, assigneeEmail, { userEmail, userName } = {}) => {
  if (!isSupabaseConfigured()) return { error: 'Not configured' };

  try {
    const { data: current } = await supabase.from('cases').select('assigned_to').eq('id', caseId).single();

    await supabase.from('cases').update({ assigned_to: assigneeEmail }).eq('id', caseId);

    await supabase.from('case_activities').insert([{
      case_id: caseId,
      user_email: userEmail || '',
      user_name: userName || '',
      activity_type: 'assignment',
      from_value: current?.assigned_to || 'unassigned',
      to_value: assigneeEmail,
    }]);

    logAudit('case_updated', { entityType: 'case', entityId: caseId, details: { action: 'assigned', to: assigneeEmail } });
    return { error: null };
  } catch (error) {
    console.error('[Workflow] Assign error:', error);
    return { error };
  }
};

export const escalateCase = async (caseId, reason, { userEmail, userName } = {}) => {
  if (!isSupabaseConfigured()) return { error: 'Not configured' };

  try {
    await supabase.from('cases').update({
      workflow_status: 'escalated',
      escalated_by: userEmail,
      escalation_reason: reason,
    }).eq('id', caseId);

    await supabase.from('case_activities').insert([{
      case_id: caseId,
      user_email: userEmail || '',
      user_name: userName || '',
      activity_type: 'escalation',
      to_value: 'escalated',
      comment: reason,
    }]);

    logAudit('case_updated', { entityType: 'case', entityId: caseId, details: { action: 'escalated', reason } });
    return { error: null };
  } catch (error) {
    console.error('[Workflow] Escalate error:', error);
    return { error };
  }
};

export const reviewCase = async (caseId, decision, notes, { userEmail, userName } = {}) => {
  if (!isSupabaseConfigured()) return { error: 'Not configured' };

  try {
    await supabase.from('cases').update({
      workflow_status: decision,
      reviewed_by: userEmail,
      review_decision: decision,
      review_notes: notes,
    }).eq('id', caseId);

    await supabase.from('case_activities').insert([{
      case_id: caseId,
      user_email: userEmail || '',
      user_name: userName || '',
      activity_type: 'review',
      to_value: decision,
      comment: notes,
    }]);

    logAudit('case_updated', { entityType: 'case', entityId: caseId, details: { action: 'review', decision, notes } });
    return { error: null };
  } catch (error) {
    console.error('[Workflow] Review error:', error);
    return { error };
  }
};

export const fetchCaseActivities = async (caseId) => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('case_activities')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Workflow] Fetch activities error:', error);
    return [];
  }
};
