import React, { useState, useEffect } from 'react';
import { 
  BarChart3, FileDown, Printer, RefreshCw, 
  Building2, Wrench, Calendar, Info, HelpCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Reports = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  // Tab: 'departments', 'maintenance', 'utilization'
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(true);

  // States
  const [deptData, setDeptData] = useState([]);
  const [maintData, setMaintData] = useState({ records: [], totalCost: 0, count: 0 });
  const [utilData, setUtilData] = useState({ total: 0, allocated: 0, maintenance: 0, reserved: 0, available: 0, utilizationRate: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${user.token}` };
      
      const [deptRes, maintRes, utilRes] = await Promise.all([
        fetch('http://localhost:5000/api/reports/departments', { headers }),
        fetch('http://localhost:5000/api/reports/maintenance', { headers }),
        fetch('http://localhost:5000/api/reports/utilization', { headers })
      ]);

      const deptVal = await deptRes.json();
      const maintVal = await maintRes.json();
      const utilVal = await utilRes.json();

      if (deptRes.ok) setDeptData(deptVal || []);
      if (maintRes.ok) setMaintData(maintVal || { records: [], totalCost: 0, count: 0 });
      if (utilRes.ok) setUtilData(utilVal || { total: 0, allocated: 0, maintenance: 0, reserved: 0, available: 0, utilizationRate: 0 });

    } catch (err) {
      showToast('Error', 'Failed to retrieve analytics databases.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Export CSV
  const handleCSVExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === 'departments') {
      csvContent += "Department,Code,Manager,Budget,Asset Count,Total Value,Budget Utilization (%)\n";
      deptData.forEach(row => {
        csvContent += `"${row.departmentName}","${row.code}","${row.managerName}",$${row.budget},${row.assetCount},$${row.totalValue},${Math.round(row.budgetUtilization)}%\n`;
      });
    } else if (activeTab === 'maintenance') {
      csvContent += "Asset Name,Serial Code,Requested By,Technician,Scheduled Date,Servicing Cost,Resolution Solution\n";
      maintData.records.forEach(row => {
        csvContent += `"${row.asset?.name || ''}","${row.asset?.assetId || ''}","${row.requestedBy?.name || ''}","${row.assignedTechnician || ''}","${row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : ''}",$${row.cost || 0},"${row.solution || ''}"\n`;
      });
    } else {
      csvContent += "Asset Metric,Count / Rate\n";
      csvContent += `Total Catalog Assets,${utilData.total}\n`;
      csvContent += `Allocated Active,${utilData.allocated}\n`;
      csvContent += `Under Maintenance,${utilData.maintenance}\n`;
      csvContent += `Reserved Schedules,${utilData.reserved}\n`;
      csvContent += `Available Inventory,${utilData.available}\n`;
      csvContent += `Utilization Rate,${Math.round(utilData.utilizationRate)}%\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AssetFlow_${activeTab}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 pb-12 print:p-0">
      
      {/* Header (Hidden during browser printing) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 bg-indigo-500 rounded"></span>
            Reports & Audits
          </h1>
          <p className="text-xs text-slate-455 dark:text-slate-400 font-medium">
            Review company asset utilization rates, department budgets, and repair expenses.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCSVExport}
            className="inline-flex justify-center items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export CSV
          </button>
          
          <button
            onClick={handlePrint}
            className="inline-flex justify-center items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Tabs strip (Hidden during browser printing) */}
      <div className="flex border-b border-slate-200/60 dark:border-slate-800 gap-6 print:hidden">
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'departments' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-750'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Department Budgets
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'maintenance' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-750'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Maintenance Costs
        </button>
        <button
          onClick={() => setActiveTab('utilization')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'utilization' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-750'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Asset Utilization
        </button>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="print-qr-section flex flex-col gap-6">
        
        {/* Print Header (Visible ONLY during printer parsing) */}
        <div className="hidden print:flex flex-col items-center text-center border-b-2 border-slate-900 pb-4 mb-4">
          <h2 className="text-xl font-black tracking-tight text-slate-900">AssetFlow Corporate Report</h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Generated: {new Date().toLocaleString()} | Requested By: {user?.name} ({user?.role})
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">
              Compiling stats...
            </span>
          </div>
        ) : (
          <>
            {/* View 1: Department Summary */}
            {activeTab === 'departments' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-enterprise dark:shadow-enterprise-dark overflow-hidden p-6 flex flex-col gap-6">
                <h3 className="text-xs font-black text-slate-850 dark:text-slate-250 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-3">
                  Department Budget Analysis
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-450 dark:text-slate-400 font-bold uppercase border-b border-slate-200/55 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Manager</th>
                        <th className="px-4 py-3">Budget Alloc.</th>
                        <th className="px-4 py-3">Assets Count</th>
                        <th className="px-4 py-3">Assets Value</th>
                        <th className="px-4 py-3 text-right">Budget Util.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-semibold">
                      {deptData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/25">
                          <td className="px-4 py-3 text-slate-850 dark:text-slate-200">{row.departmentName}</td>
                          <td className="px-4 py-3 text-slate-400 font-mono">{row.code}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.managerName}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">${row.budget.toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.assetCount}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">${row.totalValue.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.budgetUtilization > 90 
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' 
                                : row.budgetUtilization > 50
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            }`}>
                              {Math.round(row.budgetUtilization)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* View 2: Maintenance Costs */}
            {activeTab === 'maintenance' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-enterprise dark:shadow-enterprise-dark overflow-hidden p-6 flex flex-col gap-6">
                
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
                  <h3 className="text-xs font-black text-slate-850 dark:text-slate-250 uppercase tracking-widest">
                    Enterprise Maintenance Costs Summary
                  </h3>
                  <div className="text-xs font-bold text-orange-600 flex gap-4">
                    <span>Total tickets resolved: {maintData.count}</span>
                    <span>Total expenditure: ${maintData.totalCost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-450 dark:text-slate-400 font-bold uppercase border-b border-slate-200/55 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Asset</th>
                        <th className="px-4 py-3">Serial ID</th>
                        <th className="px-4 py-3">Servicing Technician</th>
                        <th className="px-4 py-3">Resolution Date</th>
                        <th className="px-4 py-3">Solution Summary</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-semibold">
                      {maintData.records.map((row) => (
                        <tr key={row._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/25">
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-250">{row.asset?.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{row.asset?.assetId}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.assignedTechnician}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                            {row.resolutionDate ? new Date(row.resolutionDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-450 italic truncate max-w-[200px]">{row.solution}</td>
                          <td className="px-4 py-3 text-right text-orange-655 font-bold">${row.cost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* View 3: Asset Utilization */}
            {activeTab === 'utilization' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Status breakdown KPI */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise dark:shadow-enterprise-dark flex flex-col gap-4">
                  <h3 className="text-xs font-black text-slate-850 dark:text-slate-250 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-3">
                    Asset Inventory Breakdown
                  </h3>
                  
                  <div className="flex flex-col gap-3 font-semibold text-xs text-slate-550 dark:text-slate-400">
                    <div className="flex justify-between items-center">
                      <span>Total Catalog Items</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{utilData.total}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-850 pt-2">
                      <span>Active Allocated Assets</span>
                      <span className="text-sm font-bold text-blue-500">{utilData.allocated}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-850 pt-2">
                      <span>Under Active Maintenance</span>
                      <span className="text-sm font-bold text-orange-500">{utilData.maintenance}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-850 pt-2">
                      <span>Reserved Bookings</span>
                      <span className="text-sm font-bold text-purple-500">{utilData.reserved}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-850 pt-2">
                      <span>Available Inventory Stocks</span>
                      <span className="text-sm font-bold text-emerald-500">{utilData.available}</span>
                    </div>
                  </div>
                </div>

                {/* Utilization gauge info */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise dark:shadow-enterprise-dark flex flex-col justify-between items-center text-center">
                  <h3 className="text-xs font-black text-slate-850 dark:text-slate-250 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-3 w-full">
                    Resource Deployment Rate
                  </h3>
                  
                  <div className="my-6 relative flex items-center justify-center">
                    {/* Circle dial */}
                    <div className="w-36 h-36 rounded-full border-8 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-indigo-500">
                          {Math.round(utilData.utilizationRate)}%
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">deployed</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-slate-450 dark:text-slate-500 leading-normal max-w-[200px]">
                    Represents the percentage of catalog items actively assigned or scheduled for use.
                  </p>
                </div>

              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};
