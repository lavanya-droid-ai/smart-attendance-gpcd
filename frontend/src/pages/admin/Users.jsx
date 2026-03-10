import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/api';
import {
  UserPlus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['student', 'teacher', 'parent', 'admin'];
const YEARS = [
  'First Year BPT',
  'Second Year BPT',
  'Third Year BPT',
  'Final Year BPT',
];

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  phone: '',
  department: '',
  year: '',
  rollNumber: '',
  employeeId: '',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (yearFilter) params.year = yearFilter;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || null);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, yearFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'student',
      phone: user.phone || '',
      department: user.department || '',
      year: user.year || '',
      rollNumber: user.rollNumber || '',
      employeeId: user.employeeId || '',
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;

      if (editing) {
        await adminAPI.updateUser(editing._id || editing.id, payload);
        toast.success('User updated successfully');
      } else {
        await adminAPI.createUser(payload);
        toast.success('User created successfully');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(user) {
    try {
      await adminAPI.toggleUserStatus(user._id || user.id);
      toast.success(
        `User ${user.isActive ? 'deactivated' : 'activated'} successfully`
      );
      fetchUsers();
    } catch {
      toast.error('Failed to toggle user status');
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      ),
    },
    { header: 'Email', accessor: 'email', cellClass: 'hidden lg:table-cell' },
    {
      header: 'Role',
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            row.role === 'admin'
              ? 'bg-purple-100 text-purple-700'
              : row.role === 'teacher'
                ? 'bg-blue-100 text-blue-700'
                : row.role === 'student'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
          }`}
        >
          {row.role}
        </span>
      ),
    },
    {
      header: 'Dept / Year',
      render: (row) => row.year || row.department || '—',
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.isActive !== false
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              row.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      headerClass: 'text-right',
      cellClass: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(row);
            }}
            className={`rounded-lg p-2 ${
              row.isActive !== false
                ? 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
            title={row.isActive !== false ? 'Deactivate' : 'Activate'}
          >
            {row.isActive !== false ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Users</h1>
            <p className="text-sm text-slate-500">
              Manage students, teachers, parents &amp; admins
            </p>
          </div>
          <button onClick={openAdd} className="btn-primary">
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="input-field w-auto min-w-[180px]"
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          searchable
          searchPlaceholder="Search users by name or email..."
          emptyMessage="No users found."
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit User' : 'Add New User'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {editing ? 'New Password (optional)' : 'Password'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateForm('password', e.target.value)}
                className="input-field"
                required={!editing}
                placeholder={editing ? 'Leave blank to keep' : ''}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => updateForm('role', e.target.value)}
                className="input-field"
                required
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                className="input-field"
              />
            </div>

            {(form.role === 'teacher' || form.role === 'admin') && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Department
                  </label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => updateForm('department', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={form.employeeId}
                    onChange={(e) => updateForm('employeeId', e.target.value)}
                    className="input-field"
                  />
                </div>
              </>
            )}

            {form.role === 'student' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Year
                  </label>
                  <select
                    value={form.year}
                    onChange={(e) => updateForm('year', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={form.rollNumber}
                    onChange={(e) => updateForm('rollNumber', e.target.value)}
                    className="input-field"
                  />
                </div>
              </>
            )}

            {form.role === 'parent' && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Department
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => updateForm('department', e.target.value)}
                  className="input-field"
                  placeholder="e.g. Ward's year / section"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editing ? (
                'Update User'
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
