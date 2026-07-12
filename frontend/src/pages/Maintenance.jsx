import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Wrench, Search, Plus, Trash2, ShieldAlert,
  ChevronLeft, ChevronRight, X, Clock, CheckCircle, RefreshCw, Info, Tag, Calendar, DollarSign, PenTool
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';

export const Maintenance = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();

  // Lists
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [description, setDescription] = useState('');

  // Workflow actions state
  const [actionRequest, setActionRequest] = useState(null); // request object to perform action on
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  
  // Workflow form parameters
  const [scheduledDate, setScheduledDate] = useState('');
  const [technician, setTechnician] = useState('');
  const [cost, setCost] = useState(0);
  const [solution, setSolution] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Trigger Action from URL params
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'request') {
      setShowRequestModal(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Load lists
  const fetchRequestsAndAssets = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${user.token}` };
      const [reqRes, astRes] = await Promise.all([
        fetch('http://localhost:5000/api/maintenance', { headers }),
        // Load assets to pick from
        fetch('http://localhost:5000/api/assets?limit=100', { headers })
      ]);

      const reqData = await reqRes.json();
      const astData = await astRes.json();

      if (reqRes.ok) setRequests(reqData || []);
      if (astRes.ok) setAssets(astData.assets || []);
    } catch (err) {
      showToast('Error', 'Failed to retrieve maintenance data.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestsAndAssets();
  }, [user]);

  // Raise request submission
  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) {
      showToast('Form Error', 'Please select an asset to service', 'Warning');
      return;
    }
    if (!description.trim()) {
      showToast('Form Error', 'Please write a brief failure description', 'Warning');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          assetId: selectedAsset,
          description
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Request Submitted', 'Service ticket registered successfully.', 'Success');
        setShowRequestModal(false);
        setDescription('');
        fetchRequestsAndAssets();
      } else {
        showToast('Submission Failed', data.message, 'Error');
      }
    } catch (err) {
      showToast('Error', 'Connection failure.', 'Error');
    }
  };

  // Approve / Schedule request
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/maintenance/${actionRequest._id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ scheduledDate })
      });
      if (response.ok) {
        showToast('Request Approved', 'Service ticket approved & scheduled.', 'Success');
        setShowApproveModal(false);
        fetchRequestsAndAssets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign technician
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/maintenance/${actionRequest._id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ technician })
      });
      if (response.ok) {
        showToast('Technician Assigned', 'Ticket marked In Progress.', 'Success');
        setShowAssignModal(false);
        fetchRequestsAndAssets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve request
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/maintenance/${actionRequest._id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          cost,
          solution,
          notes: resolutionNotes
        })
      });
      if (response.ok) {
        showToast('Ticket Resolved', 'Asset restored to Available status.', 'Success');
        setShowResolveModal(false);
        // Reset inputs
        setCost(0);
        setSolution('');
        setResolutionNotes('');
        fetchRequestsAndAssets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel Request
  const handleCancelRequest = async (req) => {
    if (!window.confirm('Cancel this maintenance request?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/maintenance/${req._id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        showToast('Ticket Cancelled', 'Maintenance request cancelled.', 'Info');
        fetchRequestsAndAssets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter requests based on user role (Employee only sees their requests)
  const filteredRequests = requests.filter(r => {
    if (user.role === 'Employee') {
      return r.requestedBy?._id === user._id || (r.asset && r.asset.assignedEmployee === user._id);
    }
    return true;
  });

  // Group requests by status columns
  const getColRequests = (statusVal) => {
    return filteredRequests.filter(r => r.status === statusVal);
  };

  const columns = [
    { title: 'Pending Approval', status: 'Pending', bg: 'border-t-4 border-amber-500 bg-amber-50/20 dark:bg-amber-950/5' },
    { title: 'Approved & Scheduled', status: 'Approved', bg: 'border-t-4 border-purple-500 bg-purple-50/20 dark:bg-purple-950/5' },
    { title: 'In Progress', status: 'In Progress', bg: 'border-t-4 border-blue-500 bg-blue-50/20 dark:bg-blue-950/5' },
    { title: 'Resolved', status: 'Resolved', bg: 'border-t-4 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/5 animate-pulse' },
    { title: 'Cancelled', status: 'Cancelled', bg: 'border-t-4 border-slate-400 bg-slate-50/20 dark:bg-slate-900/5' }
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 bg-orange-500 rounded"></span>
            Maintenance Module
          </h1>
          <p className="text-xs text-slate-455 dark:text-slate-400 font-medium">
            Monitor and raise hardware diagnostic requests, schedule technician calibrations, and log repair outlays.
          </p>
        </div>

        <button
          onClick={() => { setSelectedAsset(assets[0]?._id || ''); setShowRequestModal(true); }}
          className="inline-flex justify-center items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Raise Request
        </button>
      </div>

      {/* Main Kanban Board */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-xs text-slate-450 font-bold uppercase tracking-wider animate-pulse">
            Syncing Work orders...
          </span>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 items-start">
          {columns.map((col) => {
            const colRequests = getColRequests(col.status);
            return (
              <div 
                key={col.status}
                className={`flex-shrink-0 w-80 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 shadow-enterprise dark:shadow-enterprise-dark ${col.bg}`}
              >
                {/* Column header */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    {col.title}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {colRequests.length}
                  </span>
                </div>

                {/* Cards stack */}
                <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
                  {colRequests.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-[10px] border border-dashed border-slate-200/40 dark:border-slate-850 rounded-xl">
                      Empty column
                    </div>
                  ) : (
                    colRequests.map((req) => (
                      <div 
                        key={req._id}
                        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow group relative"
                      >
                        {/* Card header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-col min-w-0 pr-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {req.asset?.name || 'Deleted Asset'}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 mt-0.5">
                              {req.asset?.assetId || 'N/A'}
                            </span>
                          </div>
                          
                          {/* Cancel button if pending */}
                          {req.status === 'Pending' && (
                            <button
                              onClick={() => handleCancelRequest(req)}
                              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-3">
                          {req.description}
                        </p>

                        {/* Info details */}
                        <div className="text-[10px] text-slate-450 flex flex-col gap-1 border-t border-slate-100 dark:border-slate-850 pt-2 font-semibold">
                          <span>Requested: {new Date(req.requestDate).toLocaleDateString()}</span>
                          {req.scheduledDate && (
                            <span>Scheduled: {new Date(req.scheduledDate).toLocaleDateString()}</span>
                          )}
                          {req.assignedTechnician && (
                            <span>Tech: {req.assignedTechnician}</span>
                          )}
                          {req.cost > 0 && (
                            <span className="text-orange-600 font-bold">Cost: ${req.cost}</span>
                          )}
                          <span>By: {req.requestedBy?.name}</span>
                        </div>

                        {/* Managers workflow buttons */}
                        {['Admin', 'Asset Manager'].includes(user.role) && (
                          <div className="flex justify-end gap-1.5 border-t border-slate-100 dark:border-slate-850 pt-2 mt-1">
                            {req.status === 'Pending' && (
                              <button
                                onClick={() => { setActionRequest(req); setScheduledDate(''); setShowApproveModal(true); }}
                                className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
                              >
                                Approve
                              </button>
                            )}
                            {(req.status === 'Approved' || req.status === 'Pending') && (
                              <button
                                onClick={() => { setActionRequest(req); setTechnician(''); setShowAssignModal(true); }}
                                className="px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                              >
                                Assign Tech
                              </button>
                            )}
                            {req.status === 'In Progress' && (
                              <button
                                onClick={() => { setActionRequest(req); setCost(0); setSolution(''); setShowResolveModal(true); }}
                                className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Raise Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <PenTool className="w-5 h-5 text-orange-500" />
                Raise Service Request
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseSubmit} className="flex flex-col gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
              
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Select Asset</label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  required
                >
                  <option value="">-- Select Asset to service --</option>
                  {assets.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.assetId})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Diagnostic Description</label>
                <textarea
                  placeholder="e.g. Keyboard keys failing, battery overheating, engine making noises..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 min-h-[100px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-150 dark:border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md shadow-orange-500/10"
                >
                  File Request
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Schedule Service</h3>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleApproveSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-500 uppercase">Scheduled Servicing Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  required
                />
              </div>
              <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold">
                Approve & Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Assign Technician</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-500 uppercase">Technician Name / ID</label>
                <input
                  type="text"
                  placeholder="e.g. Alice Fixer (Hardware Lead)"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  required
                />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                Assign & Start Work
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Complete Repair & Resolve</h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleResolveSubmit} className="flex flex-col gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
              
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Total Servicing Cost ($)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Solution Summary</label>
                <textarea
                  placeholder="Describe parts replaced or software updates applied..."
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none min-h-[60px]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase">Closing Notes</label>
                <textarea
                  placeholder="Warranty dates, diagnostic confirmation details..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none min-h-[60px]"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/10 mt-2">
                Resolve Work Order
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
