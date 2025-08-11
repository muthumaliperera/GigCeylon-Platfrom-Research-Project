import React, { useEffect, useMemo, useState } from 'react';
import { adminService, AdminUserItem, Role } from '../../services/adminService';
import { Link } from 'react-router-dom';

const roleTabs: { key: Role; label: string }[] = [
  { key: 'job_seeker', label: 'Job Seekers' },
  { key: 'talent_connector', label: 'Talent Connectors' },
];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

const AdminUsersPage: React.FC = () => {
  const [activeRole, setActiveRole] = useState<Role>('job_seeker');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.listUsers({ role: activeRole, search, page, pageSize });
      setUsers(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole, page, pageSize]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const submitCreate = async () => {
    setCreating(true);
    setError('');
    try {
      await adminService.createUser({ ...createData, role: activeRole });
      setShowCreate(false);
      setCreateData({ firstName: '', lastName: '', email: '', password: '' });
      fetchUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await adminService.toggleActive(id);
      fetchUsers();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8F9]">
      <nav className="bg-white shadow">
        <div className="max-w-full px-24">
          <div className="flex items-center gap-6 py-3">
            <Link to="/admin-dashboard" className="text-xl font-semibold hover:text-blue-600">Dashboard</Link>
            <span className="text-xl font-semibold text-blue-600">Users</span>
            <Link to="#" className="text-xl font-semibold hover:text-blue-600">Jobs</Link>
            <Link to="#" className="text-xl font-semibold hover:text-blue-600">Payment Plans</Link>
            <Link to="#" className="text-xl font-semibold hover:text-blue-600">Reviews</Link>
            <Link to="#" className="text-xl font-semibold hover:text-blue-600">Finance</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {roleTabs.map(tab => (
                <button
                  key={tab.key}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${activeRole === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => { setActiveRole(tab.key); setPage(1); }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={() => setShowCreate(true)}>
              Create {activeRole === 'job_seeker' ? 'Job Seeker' : 'Talent Connector'}
            </button>
          </div>

          <form onSubmit={onSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email"
                className="flex-1 border rounded px-3 py-2"
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Search</button>
            </div>
          </form>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date Registered</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">No users found</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u._id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{u.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{u.phone}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">LKR {u.rate}/hr</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 rounded bg-gray-100 text-gray-700" disabled>Edit</button>
                          <button onClick={() => toggleActive(u._id)} className={`px-3 py-1 rounded ${u.isActive ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Total: {total}</div>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50">Prev</button>
              <span className="text-sm">Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Create {activeRole === 'job_seeker' ? 'Job Seeker' : 'Talent Connector'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={createData.firstName} onChange={(e) => setCreateData({ ...createData, firstName: e.target.value })} placeholder="First name" className="border rounded px-3 py-2" />
              <input value={createData.lastName} onChange={(e) => setCreateData({ ...createData, lastName: e.target.value })} placeholder="Last name" className="border rounded px-3 py-2" />
              <input value={createData.email} onChange={(e) => setCreateData({ ...createData, email: e.target.value })} placeholder="Email" className="border rounded px-3 py-2 md:col-span-2" />
              <input value={createData.password} type="password" onChange={(e) => setCreateData({ ...createData, password: e.target.value })} placeholder="Password" className="border rounded px-3 py-2 md:col-span-2" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 rounded bg-gray-100" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={creating} onClick={submitCreate}>{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
