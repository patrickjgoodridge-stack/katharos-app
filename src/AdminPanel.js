import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, UserX, ChevronDown } from 'lucide-react';
import { fetchTeamUsers, updateUserRole, suspendUser } from './userService';
import { useAuth } from './AuthContext';

const ROLE_COLORS = {
  admin: '#9c27b0',
  analyst: '#2196f3',
  reviewer: '#ff9800',
  viewer: '#9e9e9e',
};

const STATUS_COLORS = {
  active: '#4caf50',
  suspended: '#f44336',
  pending: '#ff9800',
};

const AdminPanel = () => {
  const { domain } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    fetchTeamUsers(domain).then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, [domain]);

  const handleRoleChange = async (userId, newRole) => {
    const { data } = await updateUserRole(userId, newRole);
    if (data) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleToggleSuspend = async (userId, currentStatus) => {
    const shouldSuspend = currentStatus === 'active';
    const { data } = await suspendUser(userId, shouldSuspend);
    if (data) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: data.status } : u));
    }
  };

  const formatDate = (ts) => {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Users style={{ width: '20px', height: '20px', color: '#9c27b0' }} />
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>User Management</h2>
        <span style={{ fontSize: '12px', color: '#888', background: '#f0f0f0', padding: '2px 8px', borderRadius: '10px' }}>{users.length} users</span>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {['admin', 'analyst', 'reviewer', 'viewer'].map(role => (
          <div key={role} style={{ padding: '12px 16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: ROLE_COLORS[role] }}>{users.filter(u => u.role === role).length}</div>
            <div style={{ fontSize: '12px', color: '#888', textTransform: 'capitalize' }}>{role}s</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase' }}>User</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase' }}>Last Login</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: '11px', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 500, color: '#1a1a1a' }}>{u.name || u.email}</div>
                  {u.name && <div style={{ fontSize: '11px', color: '#999' }}>{u.email}</div>}
                  {u.company && <div style={{ fontSize: '11px', color: '#aaa' }}>{u.company}</div>}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      style={{
                        appearance: 'none', padding: '4px 24px 4px 8px', borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        background: (ROLE_COLORS[u.role] || '#9e9e9e') + '20',
                        color: ROLE_COLORS[u.role] || '#9e9e9e',
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="analyst">Analyst</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <ChevronDown style={{ width: '10px', height: '10px', position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: ROLE_COLORS[u.role] }} />
                  </div>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                    background: (STATUS_COLORS[u.status] || '#9e9e9e') + '20',
                    color: STATUS_COLORS[u.status] || '#9e9e9e',
                  }}>
                    {u.status === 'active' ? <UserCheck style={{ width: '11px', height: '11px' }} /> : <UserX style={{ width: '11px', height: '11px' }} />}
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: '#888', fontSize: '12px' }}>{formatDate(u.last_login)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    onClick={() => handleToggleSuspend(u.id, u.status)}
                    style={{
                      padding: '4px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px', cursor: 'pointer',
                      background: u.status === 'active' ? '#fff5f5' : '#f0fff0',
                      color: u.status === 'active' ? '#f44336' : '#4caf50',
                    }}
                  >
                    {u.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Loading users...</div>}

      <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Shield style={{ width: '14px', height: '14px', color: '#9c27b0' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Permission Reference</span>
        </div>
        <div style={{ fontSize: '12px', color: '#777', lineHeight: '1.8' }}>
          <strong>Admin:</strong> Full access — screening, cases, user management, audit logs, reports<br />
          <strong>Analyst:</strong> Screen, create/update cases, assign, escalate, export reports<br />
          <strong>Reviewer:</strong> View/update cases, approve/reject decisions, export reports<br />
          <strong>Viewer:</strong> Read-only access to cases
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
