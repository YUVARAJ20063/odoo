import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, User, ShieldAlert, Key, 
  Building2, Users, Plus, X, RefreshCw, CheckCircle, Mail, Phone, Lock, Trash2, Edit3, Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useNotifications();

  // Active Settings panel: 'profile', 'enterprise', 'users', 'departments', 'categories'
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('');

  // Enterprise System States
  const [companyName, setCompanyName] = useState('AssetFlow Corp');
  const [currency, setCurrency] = useState('USD');
  const [prefix, setPrefix] = useState('AF-MNT-');
  const [systemMode, setSystemMode] = useState('Production');

  // User Accounts list (Admin only)
  const [systemUsers, setSystemUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Employee');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Department Management States
  const [departments, setDepartments] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptBudget, setDeptBudget] = useState(0);
  const [deptDesc, setDeptDesc] = useState('');
  const [deptManager, setDeptManager] = useState('');
  const [deptParent, setDeptParent] = useState('');
  const [deptStatus, setDeptStatus] = useState('Active');

  // Category Management States
  const [categories, setCategories] = useState([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catFields, setCatFields] = useState([]); // Array of { name: '', type: 'String', required: false }

  // Fetch accounts list (Admin only)
  const fetchSystemUsers = async () => {
    if (user?.role !== 'Admin') return;
    try {
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSystemUsers(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Enterprise settings
  const fetchEnterpriseSettings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/system/settings', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setCompanyName(data.companyName);
        setCurrency(data.currency);
        setPrefix(data.maintenancePrefix);
        setSystemMode(data.systemMode);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Departments
  const fetchDepartments = async () => {
    if (user?.role !== 'Admin') return;
    try {
      const response = await fetch('http://localhost:5000/api/departments', {
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

  // Fetch Categories
  const fetchCategories = async () => {
    if (user?.role !== 'Admin') return;
    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setCategories(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEnterpriseSettings();
    if (user?.role === 'Admin') {
      fetchSystemUsers();
      fetchDepartments();
      fetchCategories();
    }
  }, [user]);

  // Save personal profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (profilePassword && profilePassword !== profilePasswordConfirm) {
      showToast('Validation Error', 'New passwords do not match.', 'Warning');
      return;
    }

    setLoading(true);
    const payload = {
      name: profileName,
      phone: profilePhone,
      avatar: profileAvatar
    };
    if (profilePassword) payload.password = profilePassword;

    const result = await updateProfile(payload);
    setLoading(false);
    
    if (result.success) {
      showToast('Profile Updated', 'Your settings have been saved successfully.', 'Success');
      setProfilePassword('');
      setProfilePasswordConfirm('');
    } else {
      showToast('Failed to save profile', result.error, 'Error');
    }
  };

  // Save enterprise system settings
  const handleEnterpriseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/system/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          companyName,
          currency,
          maintenancePrefix: prefix,
          systemMode
        })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showToast('Settings Saved', 'Global enterprise configuration updated.', 'Success');
      } else {
        showToast('Error', data.message, 'Error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Error', 'Failed to connect to configurations API.', 'Error');
    }
  };

  // Create user submit (Admin only)
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      showToast('Form Error', 'Please complete all required fields.', 'Warning');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          phone: newUserPhone
        })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showToast('User Created', `Registered new profile for ${newUserName} (${newUserRole})`, 'Success');
        setShowUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserPhone('');
        fetchSystemUsers();
      } else {
        showToast('Save Failed', data.message, 'Error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Error', 'Connection failed.', 'Error');
    }
  };

  // Save Department (Create / Edit)
  const handleSaveDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptName || !deptCode) {
      showToast('Validation Error', 'Department name and code are required.', 'Warning');
      return;
    }

    setLoading(true);

    const payload = {
      name: deptName,
      code: deptCode,
      budget: Number(deptBudget),
      description: deptDesc,
      manager: deptManager || null,
      parentDepartment: deptParent || null,
      status: deptStatus
    };

    try {
      const url = editingDept
        ? `http://localhost:5000/api/departments/${editingDept._id}`
        : 'http://localhost:5000/api/departments';
      const method = editingDept ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showToast(
          editingDept ? 'Department Updated' : 'Department Created',
          `Successfully saved ${deptName}`,
          'Success'
        );
        setShowDeptModal(false);
        fetchDepartments();
      } else {
        showToast('Save Failed', data.message, 'Error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Error', 'Network request failed.', 'Error');
    }
  };

  // Save Asset Category (Create / Edit)
  const handleSaveCatSubmit = async (e) => {
    e.preventDefault();
    if (!catName || !catCode) {
      showToast('Validation Error', 'Category name and code are required.', 'Warning');
      return;
    }

    setLoading(true);

    const payload = {
      name: catName,
      code: catCode,
      description: catDesc,
      fields: catFields
    };

    try {
      const url = editingCat
        ? `http://localhost:5000/api/categories/${editingCat._id}`
        : 'http://localhost:5000/api/categories';
      const method = editingCat ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showToast(
          editingCat ? 'Category Updated' : 'Category Created',
          `Successfully saved ${catName}`,
          'Success'
        );
        setShowCatModal(false);
        fetchCategories();
      } else {
        showToast('Save Failed', data.message, 'Error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Error', 'Network request failed.', 'Error');
    }
  };

  const openAddDeptModal = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode('');
    setDeptBudget(0);
    setDeptDesc('');
    setDeptManager('');
    setDeptParent('');
    setDeptStatus('Active');
    setShowDeptModal(true);
  };

  const openEditDeptModal = (dept) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptBudget(dept.budget || 0);
    setDeptDesc(dept.description || '');
    setDeptManager(dept.manager?._id || '');
    setDeptParent(dept.parentDepartment?._id || '');
    setDeptStatus(dept.status || 'Active');
    setShowDeptModal(true);
  };

  const openAddCatModal = () => {
    setEditingCat(null);
    setCatName('');
    setCatCode('');
    setCatDesc('');
    setCatFields([]);
    setShowCatModal(true);
  };

  const openEditCatModal = (cat) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatCode(cat.code);
    setCatDesc(cat.description || '');
    setCatFields(cat.fields || []);
    setShowCatModal(true);
  };

  const handleAddField = () => {
    setCatFields([...catFields, { name: '', type: 'String', required: false }]);
  };

  const handleRemoveField = (index) => {
    const updated = catFields.filter((_, idx) => idx !== index);
    setCatFields(updated);
  };

  const handleFieldChange = (index, key, val) => {
    const updated = catFields.map((field, idx) => {
      if (idx === index) {
        return { ...field, [key]: val };
      }
      return field;
    });
    setCatFields(updated);
  };

  const deleteDepartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Deleted', 'Department removed successfully.', 'Success');
        fetchDepartments();
      } else {
        showToast('Error', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Deletion failed.', 'Error');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Deleted', 'Asset Category removed successfully.', 'Success');
        fetchCategories();
      } else {
        showToast('Error', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Deletion failed.', 'Error');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-6 bg-slate-500 rounded"></span>
          System Settings
        </h1>
        <p className="text-xs text-slate-450 dark:text-slate-400 font-medium">
          Modify your employee profile settings, and adjust corporate metadata scopes.
        </p>
      </div>

      {/* Grid: Left menu + Right Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left tabs menu */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 shadow-enterprise flex flex-col gap-1 h-fit">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'profile' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800/30'
            }`}
          >
            <User className="w-4 h-4 text-slate-450" />
            Personal Profile
          </button>
          
          {user?.role === 'Admin' && (
            <>
              <button
                onClick={() => setActiveTab('enterprise')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'enterprise' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <Building2 className="w-4 h-4 text-slate-450" />
                Branding & Rules
              </button>
              
              <button
                onClick={() => setActiveTab('departments')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'departments' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <Building2 className="w-4 h-4 text-slate-450" />
                Departments (Tab A)
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'categories' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <Tag className="w-4 h-4 text-slate-450" />
                Asset Categories (Tab B)
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'users' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <Users className="w-4 h-4 text-slate-450" />
                System Logins
              </button>
            </>
          )}
        </div>

        {/* Right Panel Content */}
        <div className="md:col-span-3">
          
          {/* Tab 1: Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise flex flex-col gap-6">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-250 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3">
                Edit Profile Information
              </h3>
              
              <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Email Address (Read-only)</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="px-3 py-2.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Authorized System Role</label>
                  <input
                    type="text"
                    value={user?.role}
                    disabled
                    className="px-3 py-2.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter full name"
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Profile Avatar Image Link</label>
                  <input
                    type="text"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="Unsplash / Dicebear URL..."
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-850 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-350 mb-3 uppercase">Change Password (Optional)</h4>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={profilePasswordConfirm}
                    onChange={(e) => setProfilePasswordConfirm(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Enterprise (Admin only) */}
          {activeTab === 'enterprise' && user?.role === 'Admin' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise flex flex-col gap-6">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-250 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3">
                Enterprise Metadata Configuration
              </h3>
              
              <form onSubmit={handleEnterpriseSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">System Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Maintenance Tag Prefix</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">System Mode</label>
                  <select
                    value={systemMode}
                    onChange={(e) => setSystemMode(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Production">Production Active</option>
                    <option value="Maintenance">Maintenance Lockdown Mode</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5"
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab A: Departments Management (Admin only) */}
          {activeTab === 'departments' && user?.role === 'Admin' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-250 uppercase tracking-widest">
                  Department Management (Tab A)
                </h3>
                <button
                  onClick={openAddDeptModal}
                  className="inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Department
                </button>
              </div>

              {/* Departments listing */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 font-bold uppercase border-b border-slate-200/50 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Dept Name</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Manager</th>
                      <th className="px-4 py-3">Parent Dept</th>
                      <th className="px-4 py-3">Budget</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-350">
                    {departments.map((dept) => (
                      <tr key={dept._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="px-4 py-3 font-bold text-slate-850 dark:text-slate-100">{dept.name}</td>
                        <td className="px-4 py-3 font-mono">{dept.code}</td>
                        <td className="px-4 py-3 text-slate-500">{dept.manager?.name || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-slate-550 dark:text-slate-400">{dept.parentDepartment?.name || 'None'}</td>
                        <td className="px-4 py-3">${(dept.budget || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            dept.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}>
                            {dept.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEditDeptModal(dept)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteDepartment(dept._id)}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-450 hover:text-rose-750 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab B: Asset Category Management (Admin only) */}
          {activeTab === 'categories' && user?.role === 'Admin' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-250 uppercase tracking-widest">
                  Asset Category Configuration (Tab B)
                </h3>
                <button
                  onClick={openAddCatModal}
                  className="inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              </div>

              {/* Categories listing */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 font-bold uppercase border-b border-slate-200/50 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Category Name</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Custom Fields Schema</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-350">
                    {categories.map((cat) => (
                      <tr key={cat._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="px-4 py-3 font-bold text-slate-850 dark:text-slate-100">{cat.name}</td>
                        <td className="px-4 py-3 font-mono">{cat.code}</td>
                        <td className="px-4 py-3 text-slate-500 font-medium truncate max-w-[200px]">{cat.description || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {cat.fields?.length === 0 ? (
                              <span className="text-slate-400 font-medium italic">No custom fields</span>
                            ) : (
                              cat.fields.map((f, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded text-slate-600 dark:text-slate-300">
                                  {f.name} ({f.type})
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEditCatModal(cat)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteCategory(cat._id)}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-450 hover:text-rose-755 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: System Users Dashboard (Admin only) */}
          {activeTab === 'users' && user?.role === 'Admin' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise flex flex-col gap-6">
              
              <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-250 uppercase tracking-widest">
                  System User Logins
                </h3>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create User
                </button>
              </div>

              {/* Users list table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-450 font-bold uppercase border-b border-slate-200/50 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">User Profile</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">System Role</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-350">
                    {systemUsers.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="px-4 py-3 flex items-center gap-2">
                          <img
                            src={item.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                            alt={item.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium">{item.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.role === 'Admin' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' :
                            item.role === 'Asset Manager' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                            item.role === 'Department Head' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' :
                            'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-sans">
                <User className="w-5 h-5 text-blue-500" />
                Register System Login
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="flex flex-col gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><User className="w-3.5 h-3.5" /></span>
                  <input
                    type="text"
                    placeholder="Eleanor Vance"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Mail className="w-3.5 h-3.5" /></span>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">System Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="Employee">Employee</option>
                  <option value="Department Head">Department Head</option>
                  <option value="Asset Manager">Asset Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Phone className="w-3.5 h-3.5" /></span>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-0000"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Secure Login Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Lock className="w-3.5 h-3.5" /></span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-150 dark:border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md flex items-center justify-center"
                >
                  {loading ? 'Creating...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-sans">
                <Building2 className="w-5 h-5 text-emerald-500" />
                {editingDept ? 'Update Department Settings' : 'Create Department'}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeptSubmit} className="flex flex-col gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Department Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Unique Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SLS"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Annual Expense Budget ($)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={deptBudget}
                  onChange={(e) => setDeptBudget(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Description / Objectives</label>
                <textarea
                  placeholder="Primary roles and cost center objectives..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 h-20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Department Head / Manager</label>
                <select
                  value={deptManager}
                  onChange={(e) => setDeptManager(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="">Choose Manager (Optional)</option>
                  {systemUsers.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Parent Department (Hierarchy)</label>
                <select
                  value={deptParent}
                  onChange={(e) => setDeptParent(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="">No Parent (Root Department)</option>
                  {departments
                    .filter(d => !editingDept || d._id !== editingDept._id)
                    .map((d) => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Status</label>
                <select
                  value={deptStatus}
                  onChange={(e) => setDeptStatus(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-150 dark:border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/10 flex items-center justify-center"
                >
                  {loading ? 'Saving...' : 'Save Department'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ASSET CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-sans">
                <Tag className="w-5 h-5 text-blue-500" />
                {editingCat ? 'Update Asset Category' : 'Create Asset Category'}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCatSubmit} className="flex flex-col gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Electronics"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Unique Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ELEC"
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Description</label>
                <textarea
                  placeholder="Describe classification scope..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 h-20"
                />
              </div>

              {/* Dynamic Fields Section */}
              <div className="border-t border-slate-150 dark:border-slate-800 pt-3 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase">Category Specific Fields</h4>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold border border-blue-200/50"
                  >
                    + Add Field Attribute
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {catFields.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 italic">No custom fields defined yet. Add attributes like "Warranty Period".</div>
                  ) : (
                    catFields.map((field, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Field name (e.g. warranty)"
                          value={field.name}
                          onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                          className="flex-grow px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                          required
                        />
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                          className="px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 w-28"
                        >
                          <option value="String">String</option>
                          <option value="Number">Number</option>
                          <option value="Boolean">Boolean</option>
                          <option value="Date">Date</option>
                        </select>
                        <label className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                            className="rounded"
                          />
                          Req
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(idx)}
                          className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:text-rose-700 rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-150 dark:border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/10 flex items-center justify-center"
                >
                  {loading ? 'Saving...' : 'Save Category'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
