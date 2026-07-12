import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Laptop, Users, Wrench, Calendar, 
  TrendingUp, Layers, Building2, AlertTriangle, 
  ChevronRight, ArrowUpRight, DollarSign, Camera 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { Timeline } from '../components/Timeline';
import { QRScannerModal } from '../components/QRScannerModal';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

export const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('https://heavy-cars-bake.loca.lt/api/reports/dashboard', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const result = await response.json();
        if (response.ok) {
          setData(result);
        } else {
          showToast('Failed to load dashboard', result.message, 'Error');
        }
      } catch (err) {
        showToast('Server connection failed', 'Could not establish connection to the backend server.', 'Error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, showToast]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* KPI Row skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        {/* Graph Row skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalAssets: 0,
    availableAssets: 0,
    allocatedAssets: 0,
    maintenanceAssets: 0,
    totalEmployees: 0,
    totalDepartments: 0,
    activeBookingsCount: 0,
    totalValue: 0,
    overdueCount: 0
  };

  // Format Recharts pie data
  const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#6366f1', '#64748b'];
  const pieData = (data?.categoryCounts || []).map((cat, idx) => ({
    name: cat._id,
    value: cat.count
  }));

  // Format Recharts bar data (monthly costs)
  const barData = (data?.monthlyMaintenance || []).map((item) => {
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      name: `${monthNames[item._id.month]} ${item._id.year}`,
      Cost: item.cost
    };
  });

  const kpiBlocks = [
    {
      title: 'Total Assets',
      value: kpis.totalAssets,
      desc: `Valued at $${kpis.totalValue.toLocaleString()}`,
      icon: Laptop,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
    },
    {
      title: 'Allocated Assets',
      value: kpis.allocatedAssets,
      desc: `${Math.round((kpis.allocatedAssets / (kpis.totalAssets || 1)) * 100)}% utilization rate`,
      icon: Users,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
    },
    {
      title: 'In Maintenance',
      value: kpis.maintenanceAssets,
      desc: 'Active service tickets',
      icon: Wrench,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30'
    },
    {
      title: 'Active Bookings',
      value: kpis.activeBookingsCount,
      desc: 'Shared conference & vehicles',
      icon: Calendar,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30'
    }
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-400 font-medium">
            Welcome back, <span className="font-bold text-slate-700 dark:text-slate-200">{user?.name}</span> ({user?.role})
          </p>
        </div>

        {/* System Overdue Alert Badge */}
        {kpis.overdueCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400 rounded-xl text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span>{kpis.overdueCount} Assets Overdue for Return!</span>
          </div>
        )}
      </div>

      {/* KPI Blocks Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiBlocks.map((block, idx) => {
          const Icon = block.icon;
          return (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-enterprise dark:shadow-enterprise-dark flex justify-between items-start"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {block.title}
                </span>
                <span className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                  {block.value}
                </span>
                <span className="text-[10px] font-semibold text-slate-550 dark:text-slate-400 mt-1">
                  {block.desc}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${block.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise dark:shadow-enterprise-dark">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">
          Quick Operations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {['Admin', 'Asset Manager'].includes(user?.role) ? (
            <button 
              onClick={() => navigate('/assets?action=create')}
              className="p-4 bg-blue-50/40 hover:bg-blue-50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 border border-blue-200/30 dark:border-blue-900/30 rounded-xl text-left transition-all duration-200 flex flex-col gap-2 group"
            >
              <div className="p-2 bg-blue-500 text-white rounded-lg w-fit group-hover:scale-110 transition-transform">
                <Laptop className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-250">Register Asset</span>
              <span className="text-[10px] text-slate-450">Add computers, devices, or furniture</span>
            </button>
          ) : (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-850 rounded-xl text-left opacity-50 flex flex-col gap-2">
              <div className="p-2 bg-slate-400 text-white rounded-lg w-fit">
                <Laptop className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-500">Register Asset</span>
              <span className="text-[10px] text-slate-450">Restricted to Managers</span>
            </div>
          )}

          <button 
            onClick={() => navigate('/bookings?action=book')}
            className="p-4 bg-purple-50/40 hover:bg-purple-50 dark:bg-purple-950/10 dark:hover:bg-purple-950/20 border border-purple-200/30 dark:border-purple-900/30 rounded-xl text-left transition-all duration-200 flex flex-col gap-2 group"
          >
            <div className="p-2 bg-purple-500 text-white rounded-lg w-fit group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-250">Book Shared Resource</span>
            <span className="text-[10px] text-slate-450">Reserve conference rooms, cars, projectors</span>
          </button>

          <button 
            onClick={() => navigate('/maintenance?action=request')}
            className="p-4 bg-orange-50/40 hover:bg-orange-50 dark:bg-orange-950/10 dark:hover:bg-orange-950/20 border border-orange-200/30 dark:border-orange-900/30 rounded-xl text-left transition-all duration-200 flex flex-col gap-2 group"
          >
            <div className="p-2 bg-orange-500 text-white rounded-lg w-fit group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-250">Request Maintenance</span>
            <span className="text-[10px] text-slate-450">Report hardware failures or schedule servicing</span>
          </button>

          <button 
            onClick={() => setScannerOpen(true)}
            className="p-4 bg-emerald-50/40 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-900/30 rounded-xl text-left transition-all duration-200 flex flex-col gap-2 group"
          >
            <div className="p-2 bg-emerald-500 text-white rounded-lg w-fit group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-250">Simulate QR Scan</span>
            <span className="text-[10px] text-slate-450">Test property tag barcode reader navigation</span>
          </button>

        </div>
      </div>

      {/* Analytics Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Maintenance Cost Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise dark:shadow-enterprise-dark flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wider">
              Maintenance Costs Trend
            </h3>
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full dark:bg-orange-950/20 border border-orange-100/30">
              Resolved Tickets Outlay
            </span>
          </div>

          <div className="h-72 w-full text-xs">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No resolved maintenance costs reported</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                    labelClassName="font-bold text-slate-800 dark:text-slate-200"
                  />
                  <Bar dataKey="Cost" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Category Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise dark:shadow-enterprise-dark flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wider mb-6">
            Asset Categories
          </h3>

          <div className="h-64 w-full flex items-center justify-center text-xs">
            {pieData.length === 0 ? (
              <div className="text-slate-400">No category catalog statistics</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Activity Timeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise dark:shadow-enterprise-dark">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wider">
              Recent System Activity
            </h3>
            <span className="text-[10px] text-slate-400">Automated Audit Trail</span>
          </div>

          <div className="max-h-96 overflow-y-auto pr-2">
            <Timeline logs={data?.recentActivities || []} />
          </div>
        </div>

        {/* Right: Overdue Return Listings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-enterprise dark:shadow-enterprise-dark">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wider mb-6">
            Overdue Returns
          </h3>
          <div className="flex flex-col gap-3">
            {(!data?.overdueAllocations || data.overdueAllocations.length === 0) ? (
              <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500">
                All allocations are within terms. No overdue assets.
              </div>
            ) : (
              data.overdueAllocations.map((alloc) => (
                <div 
                  key={alloc._id}
                  className="p-3 bg-rose-50/50 border border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30 rounded-xl text-xs flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {alloc.asset?.name}
                    </span>
                    <span className="text-[9px] font-mono bg-rose-100 text-rose-700 px-1 rounded dark:bg-rose-900/30 dark:text-rose-455">
                      {alloc.asset?.assetId}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Holder: {alloc.employee ? alloc.employee.name : alloc.department?.name}</span>
                    <span className="font-semibold text-rose-600">
                      Due: {new Date(alloc.returnDueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal 
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />

    </div>
  );
};
