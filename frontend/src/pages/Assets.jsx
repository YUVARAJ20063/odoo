import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Laptop, Search, Plus, Filter, ArrowUpDown, ChevronDown, 
  Trash2, Edit3, UserCheck, ShieldAlert, CheckCircle, RefreshCw,
  QrCode, FileDown, Eye, Check, X, Calendar, Upload, PlusCircle, Paperclip
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';
import { QRCard } from '../components/QRCard';

export const Assets = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();

  // API query parameters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [condition, setCondition] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  
  // Lists
  const [assets, setAssets] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Panels
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationAsset, setAllocationAsset] = useState(null);
  const [allocationType, setAllocationType] = useState('allocate'); // allocate vs transfer
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');

  // Asset Details Side Drawer
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);
  const [detailHistory, setDetailHistory] = useState({ allocations: [], maintenances: [] });
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Form State
  const [formAssetId, setFormAssetId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Laptop');
  const [formModel, setFormModel] = useState('');
  const [formManufacturer, setFormManufacturer] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formPurchaseCost, setFormPurchaseCost] = useState(0);
  const [formCondition, setFormCondition] = useState('New');
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSpecs, setFormSpecs] = useState([{ key: '', value: '' }]);
  const [formDocs, setFormDocs] = useState([]); // array of {name, url}
  const [uploading, setUploading] = useState(false);

  // Trigger Action from URL params (e.g. from navbar Quick Actions)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create' && ['Admin', 'Asset Manager'].includes(user?.role)) {
      setEditingAsset(null);
      resetForm();
      setShowFormModal(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, user, setSearchParams]);

  // Fetch data
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const q = `?search=${search}&category=${category}&status=${status}&condition=${condition}&sortBy=${sortBy}&order=${order}&page=${page}&limit=10`;
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/assets${q}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAssets(data.assets || []);
        setTotalPages(data.pages || 1);
        setTotalAssets(data.total || 0);
      }
    } catch (err) {
      showToast('Error', 'Failed to retrieve assets list.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesAndDepts = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${user.token}` };
      const [empRes, deptRes] = await Promise.all([
        fetch('https://heavy-cars-bake.loca.lt/api/employees', { headers }),
        fetch('https://heavy-cars-bake.loca.lt/api/departments', { headers })
      ]);
      const empData = await empRes.json();
      const deptData = await deptRes.json();
      if (empRes.ok) setEmployees(empData || []);
      if (deptRes.ok) setDepartments(deptData || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, category, status, condition, sortBy, order, page]);

  useEffect(() => {
    fetchEmployeesAndDepts();
  }, []);

  const resetForm = () => {
    setFormAssetId(`AST-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormName('');
    setFormCategory('Laptop');
    setFormModel('');
    setFormManufacturer('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormPurchaseCost(0);
    setFormCondition('New');
    setFormLocation('');
    setFormNotes('');
    setFormImage('');
    setFormSpecs([{ key: '', value: '' }]);
    setFormDocs([]);
  };

  // Image Upload handler
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://heavy-cars-bake.loca.lt/api/assets/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        if (type === 'image') {
          setFormImage(data.url);
          showToast('Image Uploaded', 'Asset catalog image uploaded successfully.', 'Success');
        } else {
          setFormDocs(prev => [...prev, { name: data.filename, url: data.url }]);
          showToast('Document Uploaded', 'Attachment added successfully.', 'Success');
        }
      } else {
        showToast('Upload Failed', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'File server upload failure.', 'Error');
    } finally {
      setUploading(false);
    }
  };

  // Save Asset (Create / Update)
  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Validation Error', 'Asset Name is required', 'Warning');
      return;
    }

    // Convert specifications array to Map structure
    const specifications = {};
    formSpecs.forEach(spec => {
      if (spec.key.trim() && spec.value.trim()) {
        specifications[spec.key.trim()] = spec.value.trim();
      }
    });

    const payload = {
      assetId: formAssetId,
      name: formName,
      category: formCategory,
      model: formModel,
      manufacturer: formManufacturer,
      purchaseDate: formPurchaseDate,
      purchaseCost: formPurchaseCost,
      condition: formCondition,
      location: formLocation,
      notes: formNotes,
      image: formImage,
      specifications,
      documents: formDocs
    };

    try {
      const url = editingAsset 
        ? `https://heavy-cars-bake.loca.lt/api/assets/${editingAsset._id}`
        : 'https://heavy-cars-bake.loca.lt/api/assets';
      
      const method = editingAsset ? 'PUT' : 'POST';

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
          editingAsset ? 'Asset Updated' : 'Asset Registered',
          `Successfully saved asset: ${formName}`,
          'Success'
        );
        setShowFormModal(false);
        fetchAssets();
      } else {
        showToast('Save Failed', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Could not establish connection to save.', 'Error');
    }
  };

  // Edit Asset Trigger
  const handleEditClick = (asset) => {
    setEditingAsset(asset);
    setFormAssetId(asset.assetId);
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormModel(asset.model || '');
    setFormManufacturer(asset.manufacturer || '');
    setFormPurchaseDate(asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '');
    setFormPurchaseCost(asset.purchaseCost || 0);
    setFormCondition(asset.condition);
    setFormLocation(asset.location || '');
    setFormNotes(asset.notes || '');
    setFormImage(asset.image || '');
    
    // Map specifications Map back to editable fields list
    const specsMap = asset.specifications || {};
    const specsArray = Object.entries(specsMap).map(([key, value]) => ({ key, value }));
    setFormSpecs(specsArray.length > 0 ? specsArray : [{ key: '', value: '' }]);

    setFormDocs(asset.documents || []);

    setShowFormModal(true);
  };

  // Delete Asset Trigger
  const handleDeleteClick = async (asset) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${asset.name} and clear all histories?`)) return;

    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/assets/${asset._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        showToast('Asset Deleted', 'Removed asset profile and logs.', 'Success');
        fetchAssets();
      } else {
        const data = await response.json();
        showToast('Delete Failed', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Connection failure to delete.', 'Error');
    }
  };

  // Allocate / Transfer Workflow
  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee && !selectedDept) {
      showToast('Form Error', 'Please assign an Employee or Department.', 'Warning');
      return;
    }

    const payload = {
      employeeId: selectedEmployee || undefined,
      departmentId: selectedDept || undefined,
      returnDueDate: returnDate || undefined,
      notes: allocationNotes
    };

    const endpoint = allocationType === 'allocate' ? 'allocate' : 'transfer';

    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/assets/${allocationAsset._id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        showToast(
          allocationType === 'allocate' ? 'Asset Allocated' : 'Asset Transferred',
          'Inventory assignment changed successfully.',
          'Success'
        );
        setShowAllocationModal(false);
        fetchAssets();
      } else {
        showToast('Operation Failed', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Server connection failure.', 'Error');
    }
  };

  // Return Asset Workflow
  const handleReturnAsset = async (asset) => {
    if (!window.confirm(`Confirm return of ${asset.name} back to available inventory?`)) return;

    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/assets/${asset._id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ notes: 'Returned via dashboard quick-action.' })
      });
      if (response.ok) {
        showToast('Asset Returned', 'Asset is now marked Available in inventory.', 'Success');
        fetchAssets();
      } else {
        const data = await response.json();
        showToast('Return Failed', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Connection failed.', 'Error');
    }
  };

  // Drawer detail loader
  const handleViewDetails = async (asset) => {
    setSelectedAssetDetail(asset);
    setDrawerLoading(true);
    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/assets/${asset.assetId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedAssetDetail(data.asset);
        setDetailHistory(data.history || { allocations: [], maintenances: [] });
      }
    } catch (err) {
      showToast('Error', 'Failed to retrieve asset historical log.', 'Error');
    } finally {
      setDrawerLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (assets.length === 0) return;
    
    // Construct CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Serial ID,Asset Name,Category,Model,Manufacturer,Purchase Cost,Status,Condition,Location\n";
    
    assets.forEach(asset => {
      csvContent += `"${asset.assetId}","${asset.name}","${asset.category}","${asset.model || ''}","${asset.manufacturer || ''}",$${asset.purchaseCost || 0},"${asset.status}","${asset.condition}","${asset.location || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AssetFlow_Inventory_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHolderName = (asset) => {
    if (asset.assignedEmployee) return asset.assignedEmployee.name;
    if (asset.assignedDepartment) return `${asset.assignedDepartment.name} (Dept)`;
    return 'None';
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 bg-blue-500 rounded"></span>
            Assets Module
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 font-medium">
            Manage company computers, mobile items, resource booking catalogs, and allocations.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex justify-center items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export CSV
          </button>
          
          {['Admin', 'Asset Manager'].includes(user?.role) && (
            <button
              onClick={() => { setEditingAsset(null); resetForm(); setShowFormModal(true); }}
              className="inline-flex justify-center items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Register Asset
            </button>
          )}
        </div>
      </div>

      {/* Filters Strip */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-enterprise dark:shadow-enterprise-dark flex flex-wrap gap-4 items-center">
        
        {/* Search */}
        <div className="flex-grow min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, manufacturer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/65 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        {/* Category */}
        <div className="min-w-[130px]">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/65 dark:border-slate-700 rounded-xl focus:outline-none text-slate-750 dark:text-slate-200 font-semibold"
          >
            <option value="">All Categories</option>
            <option value="Laptop">Laptops</option>
            <option value="Mobile">Mobiles</option>
            <option value="Projector">Projectors</option>
            <option value="Meeting Room">Meeting Rooms</option>
            <option value="Vehicle">Vehicles</option>
            <option value="Furniture">Furniture</option>
          </select>
        </div>

        {/* Status */}
        <div className="min-w-[130px]">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/65 dark:border-slate-700 rounded-xl focus:outline-none text-slate-750 dark:text-slate-200 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Reserved">Reserved</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Lost">Lost</option>
            <option value="Retired">Retired</option>
            <option value="Disposed">Disposed</option>
          </select>
        </div>

        {/* Condition */}
        <div className="min-w-[130px]">
          <select
            value={condition}
            onChange={(e) => { setCondition(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/65 dark:border-slate-700 rounded-xl focus:outline-none text-slate-750 dark:text-slate-200 font-semibold"
          >
            <option value="">All Conditions</option>
            <option value="New">New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

      </div>

      {/* Grid Catalog / Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-enterprise dark:shadow-enterprise-dark overflow-hidden">
        
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">
              Retrieving Catalog...
            </span>
          </div>
        ) : assets.length === 0 ? (
          <div className="py-24 text-center text-sm text-slate-450 dark:text-slate-500">
            No assets registered matching your search configurations
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-450 dark:text-slate-400 font-bold uppercase border-b border-slate-200/55 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Asset Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4">Current Holder</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {assets.map((asset) => (
                  <tr 
                    key={asset._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                  >
                    {/* Item */}
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-3">
                        {asset.image ? (
                          <img 
                            src={asset.image} 
                            alt="asset" 
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" 
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100 dark:border-blue-900/20">
                            <Laptop className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-850 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                            {asset.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 mt-0.5">
                            {asset.assetId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 font-semibold text-slate-550 dark:text-slate-300">
                      {asset.category}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={asset.status} />
                    </td>

                    {/* Condition */}
                    <td className="px-6 py-4 text-slate-500 font-semibold dark:text-slate-400">
                      {asset.condition}
                    </td>

                    {/* Holder */}
                    <td className="px-6 py-4 font-bold text-slate-650 dark:text-slate-300">
                      {getHolderName(asset)}
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {asset.location || 'HQ Storage'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        
                        <button
                          onClick={() => handleViewDetails(asset)}
                          title="View tag & logs"
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-500 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Allocate/Return controls (Admin/Manager only) */}
                        {['Admin', 'Asset Manager'].includes(user?.role) && (
                          <>
                            {asset.status === 'Available' && (
                              <button
                                onClick={() => { setAllocationAsset(asset); setAllocationType('allocate'); setShowAllocationModal(true); }}
                                title="Allocate to user"
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {asset.status === 'Allocated' && (
                              <>
                                <button
                                  onClick={() => { setAllocationAsset(asset); setAllocationType('transfer'); setShowAllocationModal(true); }}
                                  title="Transfer assignment"
                                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleReturnAsset(asset)}
                                  title="Return to inventory"
                                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleEditClick(asset)}
                              title="Edit specifications"
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteClick(asset)}
                              title="Delete profile"
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-455 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/10 border-t border-slate-200/50 dark:border-slate-850 flex justify-between items-center text-xs">
            <span className="text-slate-450 dark:text-slate-500 font-semibold">
              Showing page {page} of {totalPages} ({totalAssets} assets)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 disabled:opacity-50 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 disabled:opacity-50 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Allocate / Transfer Modal Overlay */}
      {showAllocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize">
                {allocationType === 'allocate' ? 'Allocate Asset' : 'Transfer Asset'}
              </h3>
              <button onClick={() => setShowAllocationModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-450">
              Assigning asset <span className="font-bold text-slate-750 dark:text-slate-200">{allocationAsset?.name}</span> to user/department.
            </p>

            <form onSubmit={handleAllocationSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Assign to Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => { setSelectedEmployee(e.target.value); if(e.target.value) setSelectedDept(''); }}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.designation})</option>
                  ))}
                </select>
              </div>

              <div className="text-center text-[10px] font-bold text-slate-400 uppercase">OR</div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Assign to Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => { setSelectedDept(e.target.value); if(e.target.value) setSelectedEmployee(''); }}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Return Due Date (Optional)</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Allocation Notes</label>
                <textarea
                  placeholder="e.g. Assigned for field trip, standard office desk usage..."
                  value={allocationNotes}
                  onChange={(e) => setAllocationNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none min-h-[60px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 mt-2"
              >
                Confirm Allocation
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Asset Form Modal Overlay (Create/Edit) */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingAsset ? `Edit Asset: ${editingAsset.name}` : 'Register New Asset'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Asset ID (Serial/Barcode)</label>
                <input
                  type="text"
                  value={formAssetId}
                  onChange={(e) => setFormAssetId(e.target.value)}
                  disabled={!!editingAsset}
                  placeholder="e.g. AST-LPT-1001"
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 disabled:opacity-50"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Asset Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Macbook Pro 16"
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Projector">Projector</option>
                  <option value="Meeting Room">Meeting Room</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Furniture">Furniture</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Model</label>
                <input
                  type="text"
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  placeholder="e.g. XPS 15 9530"
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Manufacturer</label>
                <input
                  type="text"
                  value={formManufacturer}
                  onChange={(e) => setFormManufacturer(e.target.value)}
                  placeholder="e.g. Dell, Apple..."
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Purchase Date</label>
                <input
                  type="date"
                  value={formPurchaseDate}
                  onChange={(e) => setFormPurchaseDate(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Purchase Cost ($)</label>
                <input
                  type="number"
                  value={formPurchaseCost}
                  onChange={(e) => setFormPurchaseCost(parseFloat(e.target.value) || 0)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. HQ Floor 3"
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Condition</label>
                <select
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              {/* Image Upload Area */}
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Asset Image</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="URL or upload file..."
                    className="flex-grow px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                  <label className="cursor-pointer p-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-750 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Specifications Map inputs (dynamic additions) */}
              <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-500 font-bold uppercase">Specifications / Attributes</label>
                  <button
                    type="button"
                    onClick={() => setFormSpecs(prev => [...prev, { key: '', value: '' }])}
                    className="text-[10px] font-bold text-blue-500 flex items-center gap-1 hover:text-blue-750"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Attribute
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {formSpecs.map((spec, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="e.g. CPU, RAM, Range"
                        value={spec.key}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSpecs(prev => prev.map((s, i) => i === index ? { ...s, key: val } : s));
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="e.g. Intel i7, 32GB"
                        value={spec.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSpecs(prev => prev.map((s, i) => i === index ? { ...s, value: val } : s));
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormSpecs(prev => prev.filter((_, i) => i !== index))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attach Documents list */}
              <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-500 font-bold uppercase">Documents / Receipts</label>
                  <label className="cursor-pointer text-[10px] font-bold text-blue-500 flex items-center gap-1 hover:text-blue-750">
                    <Paperclip className="w-3.5 h-3.5" /> Attach Document
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'doc')}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formDocs.map((doc, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-semibold border border-slate-200/50 dark:border-slate-700"
                    >
                      <Paperclip className="w-3 h-3 text-slate-450" />
                      <span className="max-w-[120px] truncate text-slate-700 dark:text-slate-300">{doc.name}</span>
                      <button 
                        type="button"
                        onClick={() => setFormDocs(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <label className="text-slate-500 font-bold uppercase">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional descriptions, warranty details, tracking exceptions..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 min-h-[80px]"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-350 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/10"
                >
                  {uploading ? 'Processing File...' : 'Save Asset Details'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Asset History Side Drawer Overlay */}
      {selectedAssetDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-2xl relative">
            
            {/* Close */}
            <button 
              onClick={() => setSelectedAssetDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Asset Header Info */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 pr-8">
                {selectedAssetDetail.image ? (
                  <img 
                    src={selectedAssetDetail.image} 
                    alt="asset" 
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700" 
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-900/20 flex-shrink-0">
                    <Laptop className="w-8 h-8" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{selectedAssetDetail.name}</h2>
                  <span className="font-mono text-xs text-slate-450 mt-1">{selectedAssetDetail.assetId}</span>
                  <div className="flex gap-2 items-center mt-2">
                    <StatusBadge status={selectedAssetDetail.status} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{selectedAssetDetail.category}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Tabs Content (Info, Specifications, QR Label, History) */}
            <div className="flex flex-col gap-6 overflow-y-auto flex-grow pr-1">
              
              {/* Specs & Details Card */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase">Technical Specifications</h3>
                
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">Manufacturer</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250">{selectedAssetDetail.manufacturer || 'Unknown'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">Model Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250">{selectedAssetDetail.model || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">Purchase Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250">
                      {selectedAssetDetail.purchaseDate ? new Date(selectedAssetDetail.purchaseDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">Purchase Value</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250">${selectedAssetDetail.purchaseCost || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">Inventory Location</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250">{selectedAssetDetail.location || 'Central Desk'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">Physical Condition</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250">{selectedAssetDetail.condition}</span>
                  </div>

                  {/* Custom spec attributes map rendering */}
                  {selectedAssetDetail.specifications && Object.entries(selectedAssetDetail.specifications).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] text-slate-400">{key}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-250">{value}</span>
                    </div>
                  ))}
                </div>

                {selectedAssetDetail.notes && (
                  <div className="border-t border-slate-200 dark:border-slate-800 mt-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Note: {selectedAssetDetail.notes}
                  </div>
                )}
              </div>

              {/* QR Label Tag Card */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase">Property ID Barcode</h3>
                <QRCard asset={selectedAssetDetail} />
              </div>

              {/* Allocation History Log */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase">Asset Allocation History</h3>
                
                {drawerLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading audit history...</div>
                ) : detailHistory.allocations.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No historical assignments registered
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {detailHistory.allocations.map((alloc) => (
                      <div 
                        key={alloc._id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-xs flex flex-col gap-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-850 dark:text-slate-250">
                            {alloc.employee ? alloc.employee.name : `${alloc.department?.name} (Dept)`}
                          </span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                            alloc.status === 'Active' 
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' 
                              : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {alloc.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 text-[10px] text-slate-450 leading-relaxed">
                          <span>Date: {new Date(alloc.allocatedDate).toLocaleDateString()}</span>
                          {alloc.returnDueDate && (
                            <span className="text-right">Due: {new Date(alloc.returnDueDate).toLocaleDateString()}</span>
                          )}
                          {alloc.returnedDate && (
                            <span className="text-right text-emerald-600 font-medium">Returned: {new Date(alloc.returnedDate).toLocaleDateString()}</span>
                          )}
                          <span>By: {alloc.allocatedBy?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Maintenance History Log */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase">Service & Repair History</h3>
                
                {drawerLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading service logs...</div>
                ) : detailHistory.maintenances.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No repair requests submitted for this asset
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {detailHistory.maintenances.map((maint) => (
                      <div 
                        key={maint._id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-xs flex flex-col gap-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200 pr-4 truncate">
                            {maint.description}
                          </span>
                          <StatusBadge status={maint.status} />
                        </div>
                        <div className="grid grid-cols-2 text-[10px] text-slate-450 mt-1 leading-normal">
                          <span>Request: {new Date(maint.requestDate).toLocaleDateString()}</span>
                          <span>Cost: ${maint.cost}</span>
                          <span>Tech: {maint.assignedTechnician || 'Unassigned'}</span>
                          {maint.resolutionDate && (
                            <span className="text-right text-emerald-600 font-medium">Resolved: {new Date(maint.resolutionDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
