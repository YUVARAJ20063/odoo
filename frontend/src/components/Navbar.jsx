import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Sun, Moon, Plus, Wrench, 
  Calendar, Laptop, ChevronDown, Check, Camera 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { QRScannerModal } from './QRScannerModal';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [searchAssets, setSearchAssets] = useState([]);
  const [searchEmployees, setSearchEmployees] = useState([]);
  const [searchBookings, setSearchBookings] = useState([]);
  
  const [scannerOpen, setScannerOpen] = useState(false);
  
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Global Search Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch search items when query changes
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchAssets([]);
      setSearchEmployees([]);
      setSearchBookings([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const headers = { 'Authorization': `Bearer ${user.token}` };
        
        // Query Assets
        const assetRes = await fetch(`http://localhost:5000/api/assets?search=${searchQuery}&limit=5`, { headers });
        const assetData = await assetRes.json();
        setSearchAssets(assetData.assets || []);

        // Query Employees
        const empRes = await fetch('http://localhost:5000/api/employees', { headers });
        const empData = await empRes.json();
        const filteredEmps = (empData || []).filter(e => 
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          e.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
        setSearchEmployees(filteredEmps);

        // Query Bookings
        const bookRes = await fetch('http://localhost:5000/api/bookings', { headers });
        const bookData = await bookRes.json();
        const filteredBooks = (bookData || []).filter(b => 
          b.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.resource && b.resource.name.toLowerCase().includes(searchQuery.toLowerCase()))
        ).slice(0, 5);
        setSearchBookings(filteredBooks);

      } catch (err) {
        console.error('Failed to run global search query:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user]);

  const handleSearchNavigate = (path) => {
    setShowSearchModal(false);
    setSearchQuery('');
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-10 w-full h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between px-6">
      
      {/* Top Left Search Trigger */}
      <div className="flex items-center gap-4 w-96">
        <button 
          onClick={() => setShowSearchModal(true)}
          className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-xl transition-all text-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search assets, employees, bookings...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-300/50 dark:border-slate-600">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Top Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* Quick Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Action</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50">
              {['Admin', 'Asset Manager'].includes(user?.role) && (
                <button
                  onClick={() => { setShowQuickActions(false); navigate('/assets?action=create'); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <Laptop className="w-4.5 h-4.5 text-blue-500" />
                  Register New Asset
                </button>
              )}
              <button
                onClick={() => { setShowQuickActions(false); navigate('/bookings?action=book'); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Calendar className="w-4.5 h-4.5 text-purple-500" />
                Book Shared Resource
              </button>
              <button
                onClick={() => { setShowQuickActions(false); navigate('/maintenance?action=request'); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Wrench className="w-4.5 h-4.5 text-orange-500" />
                Request Repair Work
              </button>
              <button
                onClick={() => { setShowQuickActions(false); setScannerOpen(true); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800"
              >
                <Camera className="w-4.5 h-4.5 text-emerald-500" />
                Simulate QR Scanner
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Alerts & Messages</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-full dark:bg-amber-950/20 dark:text-amber-400">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No alerts logged</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className={`p-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex flex-col gap-1 ${
                        !notif.read ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{notif.title}</span>
                        {!notif.read && (
                          <button 
                            onClick={() => markAsRead(notif._id)}
                            className="text-[9px] font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-0.5 flex-shrink-0"
                          >
                            <Check className="w-2.5 h-2.5" /> Mark read
                          </button>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 leading-normal">{notif.message}</p>
                      <span className="text-[9px] text-slate-400 mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Trigger */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1.5 rounded-xl transition-all"
          >
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
              alt="avatar" 
              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setShowProfile(false); navigate('/settings'); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Profile & Settings
              </button>
              <button
                onClick={() => { setShowProfile(false); logout(); navigate('/login'); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-rose-500"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Global Search Dialog Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
            
            {/* Search Input */}
            <div className="flex items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
              <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search resources, employees, schedules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent border-0 focus:outline-none text-slate-850 dark:text-slate-100 text-sm placeholder-slate-400"
              />
              <button 
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded bg-slate-200/50 dark:bg-slate-700 text-[10px] font-bold px-1.5"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
              {searchQuery.trim().length < 2 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                  Type at least 2 characters to search the enterprise database...
                </div>
              ) : searchAssets.length === 0 && searchEmployees.length === 0 && searchBookings.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                  No records matching your search queries
                </div>
              ) : (
                <>
                  {/* Assets Section */}
                  {searchAssets.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Assets</h4>
                      <div className="flex flex-col gap-1.5">
                        {searchAssets.map((asset) => (
                          <button
                            key={asset._id}
                            onClick={() => handleSearchNavigate(`/assets/${asset.assetId}`)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg text-xs flex justify-between items-center transition-colors"
                          >
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.name}</span>
                            <span className="font-mono text-[10px] text-slate-450 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{asset.assetId}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Employees Section */}
                  {searchEmployees.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">Employees</h4>
                      <div className="flex flex-col gap-1.5">
                        {searchEmployees.map((emp) => (
                          <button
                            key={emp._id}
                            onClick={() => handleSearchNavigate(`/employees?id=${emp._id}`)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg text-xs flex justify-between items-center transition-colors"
                          >
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{emp.name}</span>
                            <span className="text-[10px] text-slate-400">{emp.designation}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bookings Section */}
                  {searchBookings.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2">Bookings</h4>
                      <div className="flex flex-col gap-1.5">
                        {searchBookings.map((book) => (
                          <button
                            key={book._id}
                            onClick={() => handleSearchNavigate(`/bookings`)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg text-xs flex justify-between items-center transition-colors"
                          >
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-4">{book.purpose}</span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {new Date(book.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* QR Scanner Simulation Modal Overlay */}
      <QRScannerModal 
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />

    </header>
  );
};
