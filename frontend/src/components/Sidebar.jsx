import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Laptop, Users, Wrench, 
  Calendar, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, Cpu, ClipboardList 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: LayoutDashboard, 
      color: 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300', 
      activeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white',
      roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] 
    },
    { 
      name: 'Assets', 
      path: '/assets', 
      icon: Laptop, 
      color: 'text-blue-500 group-hover:text-blue-600', 
      activeBg: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500',
      roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] 
    },
    { 
      name: 'Employees', 
      path: '/employees', 
      icon: Users, 
      color: 'text-emerald-500 group-hover:text-emerald-600', 
      activeBg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500',
      roles: ['Admin', 'Asset Manager', 'Department Head'] 
    },
    { 
      name: 'Maintenance', 
      path: '/maintenance', 
      icon: Wrench, 
      color: 'text-orange-500 group-hover:text-orange-600', 
      activeBg: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-l-4 border-orange-500',
      roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] 
    },
    { 
      name: 'Bookings', 
      path: '/bookings', 
      icon: Calendar, 
      color: 'text-purple-500 group-hover:text-purple-600', 
      activeBg: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-l-4 border-purple-500',
      roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] 
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: BarChart3, 
      color: 'text-indigo-500 group-hover:text-indigo-600', 
      activeBg: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-500',
      roles: ['Admin', 'Asset Manager', 'Department Head'] 
    },
    { 
      name: 'Audits', 
      path: '/audits', 
      icon: ClipboardList, 
      color: 'text-rose-500 group-hover:text-rose-600', 
      activeBg: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-l-4 border-rose-500',
      roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] 
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: Settings, 
      color: 'text-slate-500 group-hover:text-slate-600', 
      activeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-l-4 border-slate-500',
      roles: ['Admin'] 
    }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div 
      className={`relative h-screen bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Trigger */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-6 -right-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 p-1 rounded-full shadow-md z-30 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-500" /> : <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />}
      </button>

      {/* Top Header */}
      <div>
        <div className={`p-6 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md flex-shrink-0 animate-pulse">
            <Cpu className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-950 to-indigo-950 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                AssetFlow
              </span>
              <span className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase">
                Enterprise OS
              </span>
            </div>
          )}
        </div>

        {/* User Card */}
        {!collapsed && user && (
          <div className="mx-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/30 dark:border-slate-800/30 flex items-center gap-3">
            <img 
              src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
              alt="avatar" 
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div className="min-w-0 flex-grow">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</h4>
              <p className="text-[10px] font-medium text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="mt-4 px-3 flex flex-col gap-1.5">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `group flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                    isActive 
                      ? item.activeBg 
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`
                }
              >
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${item.color}`} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Log out */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className={`w-full group flex items-center gap-4 px-4 py-3 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};
