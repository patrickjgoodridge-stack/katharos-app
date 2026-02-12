import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight, AlertTriangle, UserCheck, MessageCircle, Shield, Search } from 'lucide-react';
import { fetchCaseActivities, WORKFLOW_STATUSES } from './workflowService';

const ACTIVITY_ICONS = {
  status_change: ArrowRight,
  assignment: UserCheck,
  escalation: AlertTriangle,
  review: Shield,
  comment: MessageCircle,
  screening_added: Search,
};

const ACTIVITY_COLORS = {
  status_change: '#2196f3',
  assignment: '#9c27b0',
  escalation: '#f44336',
  review: '#4caf50',
  comment: '#607d8b',
  screening_added: '#ff9800',
};

const formatTime = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const describeActivity = (activity) => {
  const name = activity.user_name || activity.user_email;
  switch (activity.activity_type) {
    case 'status_change': {
      const from = WORKFLOW_STATUSES[activity.from_value]?.label || activity.from_value;
      const to = WORKFLOW_STATUSES[activity.to_value]?.label || activity.to_value;
      return <span><strong>{name}</strong> changed status from <em>{from}</em> to <em>{to}</em></span>;
    }
    case 'assignment':
      return <span><strong>{name}</strong> assigned case to <strong>{activity.to_value}</strong></span>;
    case 'escalation':
      return <span><strong>{name}</strong> escalated this case</span>;
    case 'review': {
      const decision = activity.to_value === 'approved' ? 'approved' : 'rejected';
      return <span><strong>{name}</strong> {decision} this case</span>;
    }
    case 'screening_added':
      return <span><strong>{name}</strong> added a screening result</span>;
    case 'comment':
      return <span><strong>{name}</strong> left a comment</span>;
    default:
      return <span><strong>{name}</strong> performed {activity.activity_type}</span>;
  }
};

const ActivityFeed = ({ caseId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    fetchCaseActivities(caseId).then(data => {
      setActivities(data);
      setLoading(false);
    });
  }, [caseId]);

  if (loading) return <div style={{ padding: '12px', fontSize: '13px', color: '#999' }}>Loading activity...</div>;
  if (activities.length === 0) return <div style={{ padding: '12px', fontSize: '13px', color: '#999' }}>No activity yet</div>;

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <Clock style={{ width: '14px', height: '14px', color: '#888' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Activity</span>
        <span style={{ fontSize: '11px', color: '#aaa' }}>{activities.length}</span>
      </div>
      <div style={{ position: 'relative', paddingLeft: '20px' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: '7px', top: '4px', bottom: '4px', width: '2px', background: '#e0e0e0' }} />

        {activities.map((act, i) => {
          const Icon = ACTIVITY_ICONS[act.activity_type] || MessageCircle;
          const color = ACTIVITY_COLORS[act.activity_type] || '#607d8b';

          return (
            <div key={act.id} style={{ position: 'relative', marginBottom: i < activities.length - 1 ? '14px' : 0 }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: '-16px', top: '3px', width: '14px', height: '14px',
                borderRadius: '50%', background: 'white', border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: '8px', height: '8px', color }} />
              </div>

              <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.5' }}>
                {describeActivity(act)}
              </div>
              {act.comment && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px', padding: '4px 8px', background: '#f5f5f5', borderRadius: '4px', borderLeft: `2px solid ${color}` }}>
                  {act.comment}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{formatTime(act.created_at)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
