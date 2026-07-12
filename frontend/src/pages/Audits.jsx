import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, X, RefreshCw, CheckCircle2, 
  AlertTriangle, Eye, ShieldCheck, Building2, Users, Calendar, HelpCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';

export const Audits = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail view state (Active Audit Session or Completed Audit View)
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create Cycle Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [scopeType, setScopeType] = useState('All');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAuditors, setSelectedAuditors] = useState([]);

  // Fetch helpers
  const [departments, setDepartments] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://heavy-cars-bake.loca.lt/api/audits', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAudits(data || []);
      }
    } catch (err) {
      showToast('Error', 'Failed to retrieve audit timeline.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeptsAndUsers = async () => {
    try {
      const deptRes = await fetch('https://heavy-cars-bake.loca.lt/api/departments', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const userRes = await fetch('https://heavy-cars-bake.loca.lt/api/auth/users', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (userRes.ok) setSystemUsers(await userRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAudits();
    if (['Admin', 'Asset Manager'].includes(user?.role)) {
      fetchDeptsAndUsers();
    }
  }, [user]);

  const viewAuditDetails = async (id) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/audits/${id}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedAudit(data);
      } else {
        showToast('Error', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Failed to retrieve cycle details.', 'Error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateCycleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      showToast('Validation Warning', 'Title and date range are required.', 'Warning');
      return;
    }

    setLoading(true);
    const payload = {
      title,
      scopeType,
      department: scopeType === 'Department' ? department : null,
      location: scopeType === 'Location' ? location : '',
      startDate,
      endDate,
      auditors: selectedAuditors
    };

    try {
      const response = await fetch('https://heavy-cars-bake.loca.lt/api/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showToast('Cycle Created', `New draft cycle "${title}" is ready.`, 'Success');
        setShowCreateModal(false);
        // Reset
        setTitle('');
        setScopeType('All');
        setDepartment('');
        setLocation('');
        setStartDate('');
        setEndDate('');
        setSelectedAuditors([]);
        fetchAudits();
      } else {
        showToast('Creation Failed', data.message, 'Error');
      }
    } catch (err) {
      setLoading(false);
      showToast('Error', 'Failed to connect to the backend.', 'Error');
    }
  };

  const startAudit = async (id) => {
    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/audits/${id}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Audit Started', 'Audit status changed to Active.', 'Success');
        fetchAudits();
        if (selectedAudit?._id === id) {
          viewAuditDetails(id);
        }
      } else {
        showToast('Error', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Action failed.', 'Error');
    }
  };

  const closeAudit = async (id) => {
    if (!window.confirm('Are you sure you want to close this audit cycle? This will lock evaluations and auto-update asset statuses (e.g. Missing to "Lost").')) return;
    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/audits/${id}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Audit Cycle Closed', 'Discrepancies registered and asset statuses updated.', 'Success');
        fetchAudits();
        if (selectedAudit?._id === id) {
          viewAuditDetails(id);
        }
      } else {
        showToast('Error', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Action failed.', 'Error');
    }
  };

  const submitAssetEvaluation = async (assetId, status, notes) => {
    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/audits/${selectedAudit._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ assetId, status, notes })
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Asset Recorded', 'Verification status saved.', 'Success');
        viewAuditDetails(selectedAudit._id);
      } else {
        showToast('Error', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Verification upload failed.', 'Error');
    }
  };

  const toggleAuditorSelection = (id) => {
    if (selectedAuditors.includes(id)) {
      setSelectedAuditors(selectedAuditors.filter(aId => aId !== id));
    } else {
      setSelectedAuditors([...selectedAuditors, id]);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-500" />
            Physical Asset Auditing
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-500 font-medium mt-1">
            Run structured cycle verification checkpoints, locate missing assets, and record conditions.
          </p>
        </div>
        {['Admin', 'Asset Manager'].includes(user?.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex justify-center items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10"
          >
            <Plus className="w-4 h-4" />
            New Audit Cycle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Audit Cycles Timeline */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 shadow-enterprise flex flex-col gap-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
            Audit Checkpoint Cycles
          </h3>

          {loading ? (
            <div className="text-center py-6 text-xs text-slate-450">Loading audit timelines...</div>
          ) : audits.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No audit cycles registered
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {audits.map((item) => (
                <div
                  key={item._id}
                  onClick={() => viewAuditDetails(item._id)}
                  className={`p-4 rounded-2xl border text-xs font-semibold cursor-pointer transition-all flex flex-col gap-2 ${
                    selectedAudit?._id === item._id
                      ? 'bg-blue-50/40 border-blue-300 dark:bg-blue-950/10 dark:border-blue-900/60'
                      : 'bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-850/40 dark:hover:bg-slate-850/70 border-slate-200/50 dark:border-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-850 dark:text-slate-200 text-sm truncate max-w-[150px]">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      item.status === 'Draft' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                      item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' :
                      'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 font-medium flex flex-col gap-1 border-t border-slate-205 dark:border-slate-800/60 pt-2 mt-1">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-slate-400" /> {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-slate-400" /> Scope: {item.scopeType} {item.scopeType === 'Department' ? `(${item.department?.code || ''})` : item.scopeType === 'Location' ? `(${item.location})` : ''}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-slate-400" /> Auditors: {item.auditors?.length || 0}</span>
                  </div>

                  {/* Actions preview */}
                  <div className="flex gap-2 mt-2">
                    {item.status === 'Draft' && ['Admin', 'Asset Manager'].includes(user?.role) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); startAudit(item._id); }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                      >
                        Start Audit
                      </button>
                    )}
                    {item.status === 'Active' && ['Admin', 'Asset Manager'].includes(user?.role) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); closeAudit(item._id); }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold"
                      >
                        Close & Commit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Columns: Active Audit Evaluations / Completed Report View */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise">
          {detailLoading ? (
            <div className="h-96 flex justify-center items-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
              Loading cycle records...
            </div>
          ) : !selectedAudit ? (
            <div className="h-96 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-350">Select Audit Cycle</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Select an audit cycle from the checklist to run evaluations or read final discrepancy logs.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Header Title info */}
              <div className="flex justify-between items-start border-b border-slate-150 dark:border-slate-800 pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">Cycle ID: {selectedAudit._id}</span>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {selectedAudit.title}
                  </h2>
                  <div className="flex flex-wrap gap-3 items-center mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(selectedAudit.startDate).toLocaleDateString()} - {new Date(selectedAudit.endDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Scope: {selectedAudit.scopeType} {selectedAudit.scopeType === 'Department' ? `(${selectedAudit.department?.code || ''})` : selectedAudit.scopeType === 'Location' ? `(${selectedAudit.location})` : ''}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedAudit.status === 'Draft' ? 'bg-slate-150 text-slate-600 dark:bg-slate-800' :
                    selectedAudit.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                    'bg-blue-50 text-blue-700 dark:bg-blue-950/20'
                  }`}>
                    {selectedAudit.status} Status
                  </span>
                  {selectedAudit.status === 'Active' && ['Admin', 'Asset Manager'].includes(user?.role) && (
                    <button
                      onClick={() => closeAudit(selectedAudit._id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold shadow-sm"
                    >
                      Close & Commit Cycle
                    </button>
                  )}
                </div>
              </div>

              {/* Summary of Report if completed */}
              {selectedAudit.status === 'Completed' && (
                <div className="p-4 bg-blue-50/40 border border-blue-200 text-blue-755 dark:bg-blue-950/10 dark:border-blue-900/40 dark:text-blue-400 rounded-2xl text-xs font-semibold leading-relaxed">
                  <h4 className="font-bold flex items-center gap-1.5 mb-2 text-sm text-blue-800 dark:text-blue-300">
                    <ShieldCheck className="w-4 h-4" />
                    Final Discrepancy Summary Report
                  </h4>
                  <pre className="font-sans whitespace-pre-wrap">{selectedAudit.discrepancyReport}</pre>
                  <p className="text-[10px] text-slate-400 mt-3 border-t border-blue-200/50 pt-2 font-medium">
                    Closed by: {selectedAudit.closedBy?.name} on {new Date(selectedAudit.closedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Scoped Asset Evaluations list */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Assets Verification Status ({selectedAudit.results?.length || 0} scoped)
                </h3>

                <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1">
                  {selectedAudit.results?.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">No assets detected matching scope query.</div>
                  ) : (
                    selectedAudit.results.map((row) => (
                      <div
                        key={row._id}
                        className="p-4 bg-slate-50/40 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                      >
                        <div className="min-w-0 pr-3 flex flex-col gap-0.5">
                          <span className="font-bold text-slate-850 dark:text-slate-200 text-sm truncate">{row.asset?.name || 'Asset Deleted'}</span>
                          <span className="font-mono text-[9px] text-slate-400">{row.asset?.assetId || 'N/A'}</span>
                          <span className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                            <span>Initial: {row.asset?.condition || 'New'}</span>
                            <span>•</span>
                            <span>Loc: {row.asset?.location || 'HQ'}</span>
                          </span>
                          {row.notes && (
                            <span className="mt-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] text-slate-500 leading-normal">
                              Note: {row.notes}
                            </span>
                          )}
                        </div>

                        {/* Audit status selector (Active) or label (Completed) */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {selectedAudit.status === 'Active' ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide text-right">Evaluate Status</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => submitAssetEvaluation(row.asset._id, 'Verified', 'Auditor verified physical asset location and condition.')}
                                  className={`px-2.5 py-1 border rounded-lg font-bold text-[10px] transition-colors ${
                                    row.status === 'Verified' 
                                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                                      : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-850 text-slate-550'
                                  }`}
                                >
                                  Verified
                                </button>
                                <button
                                  onClick={() => submitAssetEvaluation(row.asset._id, 'Missing', 'Asset could not be found at destination location.')}
                                  className={`px-2.5 py-1 border rounded-lg font-bold text-[10px] transition-colors ${
                                    row.status === 'Missing' 
                                      ? 'bg-rose-600 border-rose-600 text-white' 
                                      : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-850 text-slate-550'
                                  }`}
                                >
                                  Missing
                                </button>
                                <button
                                  onClick={() => submitAssetEvaluation(row.asset._id, 'Damaged', 'Physical asset is damaged. Recommending servicing.')}
                                  className={`px-2.5 py-1 border rounded-lg font-bold text-[10px] transition-colors ${
                                    row.status === 'Damaged' 
                                      ? 'bg-orange-600 border-orange-600 text-white' 
                                      : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-850 text-slate-550'
                                  }`}
                                >
                                  Damaged
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              row.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                              row.status === 'Missing' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' :
                              row.status === 'Damaged' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/20' :
                              'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}>
                              {row.status}
                            </span>
                          )}

                          {row.auditedBy && (
                            <span className="text-[9px] text-slate-400 font-medium">
                              By: {row.auditedBy.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-sans">
                <ClipboardList className="w-5 h-5 text-blue-500" />
                Initialize Asset Audit Cycle
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCycleSubmit} className="flex flex-col gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
              
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Cycle Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 IT Hardware Audit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Audit Scope</label>
                <select
                  value={scopeType}
                  onChange={(e) => setScopeType(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="All">All Assets</option>
                  <option value="Department">By Department</option>
                  <option value="Location">By Location</option>
                </select>
              </div>

              {scopeType === 'Department' && (
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Scope Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-250"
                    required
                  >
                    <option value="">Choose Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {scopeType === 'Location' && (
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Scope Location / Building</label>
                  <input
                    type="text"
                    placeholder="e.g. Floor 3"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 uppercase">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              {/* Auditors checkboxes */}
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Assign Auditors</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-h-[120px] overflow-y-auto flex flex-col gap-2">
                  {systemUsers.map((u) => (
                    <label key={u._id} className="flex items-center gap-2 cursor-pointer font-medium text-slate-750 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedAuditors.includes(u._id)}
                        onChange={() => toggleAuditorSelection(u._id)}
                        className="rounded text-blue-650"
                      />
                      {u.name} ({u.role})
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-150 dark:border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/10 flex items-center justify-center"
                >
                  {loading ? 'Creating...' : 'Launch Cycle'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
