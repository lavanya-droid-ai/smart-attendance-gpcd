import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { adminAPI } from '../../services/api';
import {
  BookOpen,
  Pencil,
  UsersRound,
  Plus,
  Loader2,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const YEARS = [
  'First Year BPT',
  'Second Year BPT',
  'Third Year BPT',
  'Final Year BPT',
];

const emptyForm = {
  name: '',
  code: '',
  year: '',
  teacher: '',
};

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await adminAPI.getClasses();
      setClasses(res.data.classes || []);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, [fetchClasses]);

  async function fetchTeachers() {
    try {
      const res = await adminAPI.getUsers({ role: 'teacher', limit: 100 });
      setTeachers(res.data.users || []);
    } catch {
      /* silent */
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(cls) {
    setEditing(cls);
    setForm({
      name: cls.name || '',
      code: cls.code || '',
      year: cls.year || '',
      teacher: cls.teacher?._id || cls.teacher?.id || cls.teacher || '',
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateClass(editing._id || editing.id, form);
        toast.success('Class updated successfully');
      } else {
        await adminAPI.createClass(form);
        toast.success('Class created successfully');
      }
      setModalOpen(false);
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  }

  async function openStudentsModal(cls) {
    setSelectedClass(cls);
    setStudentSearch('');
    setStudentsModalOpen(true);

    const enrolled = cls.students || [];
    setEnrolledStudents(enrolled);

    try {
      const res = await adminAPI.getUsers({ role: 'student', search: '', limit: 50 });
      setAllStudents(res.data.users || []);
    } catch {
      toast.error('Failed to load students');
    }
  }

  async function handleEnroll(student) {
    if (!selectedClass) return;
    setEnrolling(true);
    try {
      await adminAPI.enrollStudents(selectedClass._id || selectedClass.id, [
        student._id || student.id,
      ]);
      setEnrolledStudents((prev) => [...prev, student]);
      toast.success(`${student.name} enrolled`);
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  }

  async function handleRemove(student) {
    if (!selectedClass) return;
    try {
      await adminAPI.removeStudent(
        selectedClass._id || selectedClass.id,
        student._id || student.id
      );
      setEnrolledStudents((prev) =>
        prev.filter(
          (s) => (s._id || s.id) !== (student._id || student.id)
        )
      );
      toast.success(`${student.name} removed`);
      fetchClasses();
    } catch {
      toast.error('Failed to remove student');
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const enrolledIds = new Set(
    enrolledStudents.map((s) => s._id || s.id)
  );

  const availableStudents = allStudents
    .filter((s) => !enrolledIds.has(s._id || s.id))
    .filter(
      (s) =>
        !studentSearch ||
        s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase())
    );

  const columns = [
    {
      header: 'Class',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.code}</p>
        </div>
      ),
    },
    { header: 'Code', accessor: 'code', cellClass: 'hidden lg:table-cell' },
    {
      header: 'Year',
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
          {row.year || '—'}
        </span>
      ),
    },
    {
      header: 'Teacher',
      render: (row) =>
        row.teacher?.name || (typeof row.teacher === 'string' ? row.teacher : '—'),
    },
    {
      header: 'Students',
      render: (row) => (
        <span className="text-sm font-medium text-slate-700">
          {row.students?.length ?? row.studentCount ?? 0}
        </span>
      ),
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
              openStudentsModal(row);
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
            title="Manage Students"
          >
            <UsersRound className="h-4 w-4" />
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
            <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
            <p className="text-sm text-slate-500">
              Manage classes and student enrollment
            </p>
          </div>
          <button onClick={openAdd} className="btn-primary">
            <BookOpen className="h-4 w-4" />
            Add Class
          </button>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={classes}
          loading={loading}
          searchable
          searchPlaceholder="Search classes..."
          emptyMessage="No classes found."
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Class' : 'Add New Class'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Class Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              className="input-field"
              placeholder="e.g. Anatomy"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Class Code
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => updateForm('code', e.target.value)}
              className="input-field"
              placeholder="e.g. ANAT-101"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Year
            </label>
            <select
              value={form.year}
              onChange={(e) => updateForm('year', e.target.value)}
              className="input-field"
              required
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
              Teacher
            </label>
            <select
              value={form.teacher}
              onChange={(e) => updateForm('teacher', e.target.value)}
              className="input-field"
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
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
                'Update Class'
              ) : (
                'Create Class'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Students Modal */}
      <Modal
        open={studentsModalOpen}
        onClose={() => setStudentsModalOpen(false)}
        title={`Manage Students — ${selectedClass?.name || ''}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Enrolled Students */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">
              Enrolled Students ({enrolledStudents.length})
            </h4>
            {enrolledStudents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                No students enrolled yet.
              </p>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {enrolledStudents.map((s) => (
                  <div
                    key={s._id || s.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {s.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.rollNumber || s.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(s)}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Students */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">
              Add Students
            </h4>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name or roll number..."
                className="input-field pl-9"
              />
              {studentSearch && (
                <button
                  onClick={() => setStudentSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {availableStudents.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                {studentSearch
                  ? 'No matching students found.'
                  : 'All students are already enrolled.'}
              </p>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {availableStudents.map((s) => (
                  <div
                    key={s._id || s.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {s.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.rollNumber || s.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEnroll(s)}
                      disabled={enrolling}
                      className="rounded-lg p-1.5 text-primary-500 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50"
                      title="Enroll"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
