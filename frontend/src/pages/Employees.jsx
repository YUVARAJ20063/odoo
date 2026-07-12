import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, Search, Plus, Mail, Phone, Building2,
  Trash2, Edit3, Eye, X, RefreshCw, Briefcase, Calendar, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';

export const Employees = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [searchParams] = useSearchParams();

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  
  // Lists
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Modal & History details
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);
  const [employeeActiveAssets, setEmployeeActiveAssets] = useState([]);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form Modal (Create/Edit)
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formEmpId, setFormEmpId] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formImage, setFormImage] = useState('');
  const [formRole, setFormRole] = useState('Employee');

  // Fetch list
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://heavy-cars-bake.loca.lt/api/employees', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setEmployees(data || []);
      }
    } catch (err) {
      showToast('Error', 'Failed to retrieve directory records.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepts = async () => {
    try {
      const response = await fetch('https://heavy-cars-bake.loca.lt/api/departments', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setDepartments(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepts();
  }, [user]);

  // Handle redirect from dashboard/search for specific employee
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && employees.length > 0) {
      const targetEmp = employees.find(e => e._id === id);
      if (targetEmp) {
        handleViewProfile(targetEmp);
      }
    }
  }, [searchParams, employees]);

  const resetForm = () => {
    setFormEmpId(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormDept(departments[0]?._id || '');
    setFormDesignation('');
    setFormStatus('Active');
    setFormImage('');
    setFormRole('Employee');
  };

  // View individual profile
  const handleViewProfile = async (emp) => {
    setSelectedEmployeeDetail(emp);
    setDetailLoading(true);
    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/employees/${emp._id}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setEmployeeActiveAssets(data.activeAssets || []);
        setEmployeeHistory(data.history || []);
      }
    } catch (err) {
      showToast('Error', 'Failed to retrieve employee file details.', 'Error');
    } finally {
      setDetailLoading(false);
    }
  };

  // Submit form (Create / Update)
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formDept) {
      showToast('Validation Warning', 'Name, Email, and Department are required.', 'Warning');
      return;
    }

    const payload = {
      employeeId: formEmpId,
      name: formName,
      email: formEmail,
      phone: formPhone,
      department: formDept,
      designation: formDesignation,
      status: formStatus,
      role: formRole,
      profileImage: formImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formName)}`
    };

    try {
      const url = editingEmployee 
        ? `https://heavy-cars-bake.loca.lt/api/employees/${editingEmployee._id}`
        : 'https://heavy-cars-bake.loca.lt/api/employees';

      const method = editingEmployee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        showToast(
          editingEmployee ? 'Profile Updated' : 'Employee Added',
          `Successfully saved profile for ${formName}`,
          'Success'
        );
        setShowFormModal(false);
        fetchEmployees();
      } else {
        showToast('Save Failed', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Connection failed while saving profile.', 'Error');
    }
  };

  // Edit employee trigger
  const handleEditClick = (emp, e) => {
    e.stopPropagation();
    setEditingEmployee(emp);
    setFormEmpId(emp.employeeId);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormPhone(emp.phone || '');
    setFormDept(emp.department?._id || '');
    setFormDesignation(emp.designation);
    setFormStatus(emp.status);
    setFormImage(emp.profileImage || '');
    setFormRole(emp.role || 'Employee');
    
    setShowFormModal(true);
  };

  // Delete employee trigger
  const handleDeleteClick = async (emp, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the profile of ${emp.name}?`)) return;

    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/employees/${emp._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Profile Deleted', 'Employee record removed.', 'Success');
        fetchEmployees();
      } else {
        showToast('Operation Blocked', data.message, 'Warning');
      }
    } catch (err) {
      showToast('Error', 'Connection failure to delete.', 'Error');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase());
    
    const matchesDept = !selectedDeptFilter || emp.department?._id === selectedDeptFilter;
    
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 bg-emerald-500 rounded"></span>
            Employees Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Browse company staff, view active physical device holders, and assign roles.
          </p>
        </div>

        {['Admin', 'Asset Manager'].includes(user?.role) && (
          <button
            onClick={() => { setEditingEmployee(null); resetForm(); setShowFormModal(true); }}
            className="inline-flex justify-center items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {/* Filters Strip */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-enterprise dark:shadow-enterprise-dark flex flex-wrap gap-4 items-center">
        
        {/* Search */}
        <div className="flex-grow min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
          <input
            type="text"
            placeholder="Search by name, ID, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-850 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        {/* Department Filter */}
        <div className="min-w-[150px]">
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/65 dark:border-slate-700 rounded-xl focus:outline-none text-slate-750 dark:text-slate-200 font-semibold"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
            ))}
          </select>
        </div>

      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">
            Loading Directory...
          </span>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="py-24 text-center text-sm text-slate-450 dark:text-slate-500">
          No employee profiles matching filters
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => (
            <div
              key={emp._id}
              onClick={() => handleViewProfile(emp)}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-enterprise hover:shadow-enterprise-hover dark:shadow-enterprise-dark hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col gap-4 group relative"
            >
              {/* Profile Card Header */}
              <div className="flex gap-4 items-center">
                <img
                  src={emp.profileImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(emp.name)}`}
                  alt={emp.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div className="min-w-0 flex-grow">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors truncate">
                    {emp.name}
                  </h3>
                  <span className="font-mono text-[9px] text-slate-400 block mt-0.5">{emp.employeeId}</span>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-slate-450 font-semibold">
                    <Briefcase className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{emp.designation}</span>
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {emp.department?.name || 'Unassigned'}
                </span>
                <span className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {emp.email}
                </span>
              </div>

              {/* Actions & Status row */}
              <div className="flex justify-between items-center mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <StatusBadge status={emp.status} />

                {/* CRUD actions for Admin/Manager */}
                {['Admin', 'Asset Manager'].includes(user?.role) && (
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditClick(emp, e)}
                      title="Edit Profile"
                      className="p-1 text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {user.role === 'Admin' && (
                      <button
                        onClick={(e) => handleDeleteClick(emp, e)}
                        title="Delete Profile"
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Employee Details Modal View */}
      {selectedEmployeeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <img
                  src={selectedEmployeeDetail.profileImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(selectedEmployeeDetail.name)}`}
                  alt={selectedEmployeeDetail.name}
                  className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedEmployeeDetail.name}
                  </h2>
                  <span className="font-mono text-xs text-slate-450 block mt-0.5">{selectedEmployeeDetail.employeeId}</span>
                  <div className="flex gap-2 items-center mt-2">
                    <StatusBadge status={selectedEmployeeDetail.status} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {selectedEmployeeDetail.designation}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmployeeDetail(null)}
                className="text-slate-400 hover:text-slate-650 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-100 dark:border-slate-800 py-4 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 uppercase">Department</span>
                <span className="text-slate-800 dark:text-slate-250 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {selectedEmployeeDetail.department?.name || 'Unassigned'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 uppercase">Email</span>
                <span className="text-slate-800 dark:text-slate-250 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedEmployeeDetail.email}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 uppercase">Phone</span>
                <span className="text-slate-800 dark:text-slate-250 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedEmployeeDetail.phone || 'N/A'}
                </span>
              </div>
            </div>

            {/* Sub content: Active allocated assets */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase">Active Assigned Assets</h3>
              {detailLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading catalog files...</div>
              ) : employeeActiveAssets.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No assets currently allocated to this employee
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {employeeActiveAssets.map(asset => (
                    <div 
                      key={asset._id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-xs flex justify-between items-center"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-slate-800 dark:text-slate-250 truncate">{asset.name}</span>
                        <span className="font-mono text-[9px] text-slate-400 mt-0.5">{asset.assetId}</span>
                      </div>
                      <StatusBadge status={asset.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub content: Allocation History */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase">Device Allocation History</h3>
              {detailLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading audit history...</div>
              ) : employeeHistory.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No allocation logs registered
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {employeeHistory.map((alloc) => (
                    <div 
                      key={alloc._id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-250">{alloc.asset?.name}</span>
                        <span className={`px-2 py-0.2 rounded text-[9px] font-semibold ${
                          alloc.status === 'Active' 
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' 
                            : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {alloc.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 text-[10px] text-slate-450 leading-relaxed">
                        <span>Assigned: {new Date(alloc.allocatedDate).toLocaleDateString()}</span>
                        {alloc.returnedDate && (
                          <span className="text-right text-emerald-600 font-semibold">Returned: {new Date(alloc.returnedDate).toLocaleDateString()}</span>
                        )}
                        <span>By: {alloc.allocatedBy?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Employee Form Modal Overlay (Create/Edit) */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingEmployee ? `Edit Profile: ${editingEmployee.name}` : 'Add Employee Profile'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="flex flex-col gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
              
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Employee ID</label>
                <input
                  type="text"
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  disabled={!!editingEmployee}
                  placeholder="e.g. EMP-001"
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 disabled:opacity-50"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="John Doe"
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Phone Number</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+1 (555) 019-1234"
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Department</label>
                <select
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Job Title / Designation</label>
                <input
                  type="text"
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  placeholder="Senior Developer"
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {user?.role === 'Admin' && (
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold uppercase">System Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Asset Manager">Asset Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-150 dark:border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/10"
                >
                  Save Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
