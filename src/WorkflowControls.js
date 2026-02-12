import React, { useState } from 'react';
import { ArrowRight, AlertTriangle, Check, X, UserCheck, ChevronDown } from 'lucide-react';
import { WORKFLOW_STATUSES, PRIORITIES, getValidTransitions } from './workflowService';

const WorkflowControls = ({ caseData, userEmail, userName, userPermission = () => true, teamUsers = [], onTransition, onAssign, onEscalate, onReview }) => {
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  const status = caseData?.workflowStatus || 'new';
  const validTransitions = getValidTransitions(status);
  const statusInfo = WORKFLOW_STATUSES[status] || WORKFLOW_STATUSES.new;
  const priorityInfo = PRIORITIES[caseData?.priority || 'medium'];

  const handleTransition = (newStatus) => {
    if (newStatus === 'escalated') {
      setShowEscalateModal(true);
    } else if (newStatus === 'approved' || newStatus === 'rejected') {
      setReviewDecision(newStatus);
      setShowReviewModal(true);
    } else {
      onTransition?.(newStatus);
    }
  };

  const handleEscalateSubmit = () => {
    onEscalate?.(escalateReason);
    setShowEscalateModal(false);
    setEscalateReason('');
  };

  const handleReviewSubmit = () => {
    onReview?.(reviewDecision, reviewNotes);
    setShowReviewModal(false);
    setReviewNotes('');
  };

  const transitionButtons = {
    screening: { label: 'Start Screening', color: '#2196f3', icon: ArrowRight },
    in_review: { label: 'Send to Review', color: '#ff9800', icon: ArrowRight },
    escalated: { label: 'Escalate', color: '#f44336', icon: AlertTriangle, permission: 'escalate' },
    approved: { label: 'Approve', color: '#4caf50', icon: Check, permission: 'approve_reject' },
    rejected: { label: 'Reject', color: '#e53935', icon: X, permission: 'approve_reject' },
    closed: { label: 'Close', color: '#757575', icon: X },
    new: { label: 'Reopen', color: '#2196f3', icon: ArrowRight },
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
          background: statusInfo.color + '20', color: statusInfo.color,
        }}>
          {statusInfo.label}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
          background: priorityInfo.color + '15', color: priorityInfo.color,
        }}>
          {priorityInfo.label} Priority
        </span>
        {caseData?.assignedTo && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
            <UserCheck style={{ width: '13px', height: '13px' }} />
            {caseData.assignedTo}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {validTransitions.map(trans => {
          const btn = transitionButtons[trans];
          if (!btn) return null;
          if (btn.permission && !userPermission(btn.permission)) return null;
          const Icon = btn.icon;
          return (
            <button
              key={trans}
              onClick={() => handleTransition(trans)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px',
                border: `1px solid ${btn.color}40`, borderRadius: '6px', background: `${btn.color}10`,
                color: btn.color, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Icon style={{ width: '12px', height: '12px' }} />
              {btn.label}
            </button>
          );
        })}

        {/* Assign button */}
        {userPermission('assign_cases') && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAssignDropdown(!showAssignDropdown)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px',
                border: '1px solid #ddd', borderRadius: '6px', background: 'white',
                color: '#555', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <UserCheck style={{ width: '12px', height: '12px' }} />
              Assign
              <ChevronDown style={{ width: '10px', height: '10px' }} />
            </button>
            {showAssignDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'white',
                border: '1px solid #ddd', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 10, minWidth: '200px', maxHeight: '200px', overflow: 'auto',
              }}>
                {teamUsers.map(u => (
                  <button
                    key={u.email}
                    onClick={() => { onAssign?.(u.email); setShowAssignDropdown(false); }}
                    style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0' }}
                  >
                    <div style={{ fontWeight: 500 }}>{u.name || u.email}</div>
                    {u.name && <div style={{ fontSize: '11px', color: '#999' }}>{u.email}</div>}
                  </button>
                ))}
                {teamUsers.length === 0 && <div style={{ padding: '12px', fontSize: '12px', color: '#999' }}>No team members</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Escalate modal */}
      {showEscalateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#f44336' }}>Escalate Case</h3>
            <textarea
              placeholder="Reason for escalation..."
              value={escalateReason}
              onChange={e => setEscalateReason(e.target.value)}
              style={{ width: '100%', height: '80px', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical', fontSize: '13px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setShowEscalateModal(false)} style={{ padding: '6px 16px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleEscalateSubmit} disabled={!escalateReason.trim()} style={{ padding: '6px 16px', border: 'none', borderRadius: '6px', background: '#f44336', color: 'white', cursor: 'pointer', fontSize: '13px', opacity: escalateReason.trim() ? 1 : 0.5 }}>Escalate</button>
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {showReviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: reviewDecision === 'approved' ? '#4caf50' : '#e53935' }}>
              {reviewDecision === 'approved' ? 'Approve Case' : 'Reject Case'}
            </h3>
            <textarea
              placeholder="Review notes..."
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              style={{ width: '100%', height: '80px', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical', fontSize: '13px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setShowReviewModal(false)} style={{ padding: '6px 16px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleReviewSubmit} style={{ padding: '6px 16px', border: 'none', borderRadius: '6px', background: reviewDecision === 'approved' ? '#4caf50' : '#e53935', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                {reviewDecision === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowControls;
