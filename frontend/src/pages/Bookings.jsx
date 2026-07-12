import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Calendar, Search, Plus, Trash2, ShieldAlert,
  ChevronLeft, ChevronRight, X, Clock, CheckCircle, RefreshCw, Info, Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';

export const Bookings = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();

  // Calendar Date
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Lists
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedResourceType, setSelectedResourceType] = useState('Meeting Room');
  const [selectedResource, setSelectedResource] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tab views (Calendar vs List)
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar' or 'list'

  // Trigger Action from URL params
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'book') {
      setShowFormModal(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Fetch bookings and bookable resources
  const fetchBookingsAndResources = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${user.token}` };
      const [bookRes, resRes] = await Promise.all([
        fetch('http://localhost:5000/api/bookings', { headers }),
        fetch('http://localhost:5000/api/bookings/resources', { headers })
      ]);
      
      const bookData = await bookRes.json();
      const resData = await resRes.json();

      if (bookRes.ok) setBookings(bookData || []);
      if (resRes.ok) {
        setResources(resData || []);
        if (resData && resData.length > 0) {
          // Preselect first resource of type 'Meeting Room'
          const defaultRes = resData.find(r => r.category === 'Meeting Room');
          setSelectedResource(defaultRes?._id || resData[0]._id);
        }
      }
    } catch (err) {
      showToast('Error', 'Failed to retrieve booking calendar details.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsAndResources();
  }, [user]);

  // Handle resource category change in form
  useEffect(() => {
    const filtered = resources.filter(r => r.category === selectedResourceType);
    if (filtered.length > 0) {
      setSelectedResource(filtered[0]._id);
    } else {
      setSelectedResource('');
    }
  }, [selectedResourceType, resources]);

  // Submit Booking Form
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResource) {
      setErrorMsg('Please select a bookable resource');
      return;
    }
    if (!purpose.trim()) {
      setErrorMsg('Please state the purpose of booking');
      return;
    }

    const startTime = new Date(`${bookingDate}T${startHour}:00`);
    const endTime = new Date(`${bookingDate}T${endHour}:00`);

    if (startTime >= endTime) {
      setErrorMsg('End time must be later than start time');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          resourceId: selectedResource,
          startTime,
          endTime,
          purpose,
          notes
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Booking Approved', 'Resource reserved successfully.', 'Success');
        setShowFormModal(false);
        // Reset form
        setPurpose('');
        setNotes('');
        fetchBookingsAndResources();
      } else {
        setErrorMsg(data.message || 'Overlapping booking occurred.');
      }
    } catch (err) {
      setErrorMsg('Server connection failure.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this resource booking?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        showToast('Booking Cancelled', 'Resource slot released.', 'Info');
        fetchBookingsAndResources();
      } else {
        const data = await response.json();
        showToast('Action Failed', data.message, 'Warning');
      }
    } catch (err) {
      showToast('Error', 'Connection failed.', 'Error');
    }
  };

  // Calendar Math - Days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    return { firstDay, totalDays };
  };

  const { firstDay, totalDays } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Get bookings for a specific day
  const getDayBookings = (dayNum) => {
    const targetDateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      dayNum
    ).toDateString();

    return bookings.filter(b => {
      const startD = new Date(b.startTime).toDateString();
      return startD === targetDateStr;
    });
  };

  // Resource Badge Colors
  const getResourceColor = (category) => {
    switch (category) {
      case 'Meeting Room': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/50';
      case 'Vehicle': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50';
      case 'Projector': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 border-slate-700';
    }
  };

  // Generate calendar grid array
  const calendarCells = [];
  // Empty spaces for previous month's padding
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  // Days of current month
  for (let i = 1; i <= totalDays; i++) {
    calendarCells.push(i);
  }

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 bg-purple-500 rounded"></span>
            Resource Bookings
          </h1>
          <p className="text-xs text-slate-455 dark:text-slate-400 font-medium">
            Reserve boardrooms, vehicles, and portable projectors for corporate actions.
          </p>
        </div>

        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/40 flex">
            <button
              onClick={() => setCurrentView('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'calendar' 
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' 
                  : 'text-slate-450 hover:text-slate-750'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setCurrentView('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'list' 
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' 
                  : 'text-slate-450 hover:text-slate-750'
              }`}
            >
              Schedule List
            </button>
          </div>

          <button
            onClick={() => { setErrorMsg(''); setShowFormModal(true); }}
            className="inline-flex justify-center items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors animate-shimmer"
          >
            <Plus className="w-4 h-4" />
            Book Resource
          </button>
        </div>
      </div>

      {/* Grid splits Calendar/List and upcoming sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main Panel */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {currentView === 'calendar' ? (
            /* Calendar Render */
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-enterprise dark:shadow-enterprise-dark p-6 flex flex-col gap-6">
              
              {/* Month Header controls */}
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {monthsList[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex gap-1.5">
                  <button 
                    onClick={prevMonth}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-550 dark:text-slate-350 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={nextMonth}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-550 dark:text-slate-350 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid Wrapper */}
              <div className="grid grid-cols-7 gap-1 border-t border-l border-slate-100 dark:border-slate-800 text-center">
                {/* Weekday names */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2.5 bg-slate-50 dark:bg-slate-800/20 text-[10px] font-bold text-slate-400 dark:text-slate-550 border-r border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest">
                    {day}
                  </div>
                ))}
                
                {/* Calendar cells */}
                {calendarCells.map((dayNum, idx) => {
                  const dayBookings = dayNum ? getDayBookings(dayNum) : [];
                  const isToday = dayNum && 
                    dayNum === new Date().getDate() && 
                    currentDate.getMonth() === new Date().getMonth() && 
                    currentDate.getFullYear() === new Date().getFullYear();

                  return (
                    <div 
                      key={idx} 
                      className={`min-h-[100px] p-1.5 border-r border-b border-slate-100 dark:border-slate-800 flex flex-col justify-between items-start transition-all relative ${
                        !dayNum ? 'bg-slate-50/20 dark:bg-[#090d16]/10' : 'bg-white dark:bg-slate-900'
                      } ${isToday ? 'ring-2 ring-purple-500/20 bg-purple-50/5 dark:bg-purple-950/5' : ''}`}
                    >
                      {dayNum ? (
                        <>
                          <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                            isToday 
                              ? 'bg-purple-600 text-white shadow-sm' 
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {dayNum}
                          </span>
                          
                          {/* Day Bookings tags */}
                          <div className="w-full flex flex-col gap-1 mt-1.5 overflow-hidden">
                            {dayBookings.slice(0, 3).map((book) => (
                              <div
                                key={book._id}
                                title={`${book.resource?.name}: ${book.purpose}`}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border truncate ${getResourceColor(book.resource?.category)}`}
                              >
                                {new Date(book.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {book.resource?.name}
                              </div>
                            ))}
                            {dayBookings.length > 3 && (
                              <span className="text-[8px] font-bold text-slate-400 self-end pr-1 mt-0.5">
                                + {dayBookings.length - 3} more
                              </span>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* Schedule List Render */
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-enterprise dark:shadow-enterprise-dark overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-450 dark:text-slate-400 font-bold uppercase border-b border-slate-200/55 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Resource</th>
                      <th className="px-6 py-4">Scheduled Interval</th>
                      <th className="px-6 py-4">Reserved By</th>
                      <th className="px-6 py-4">Purpose</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-450">No schedules booked</td>
                      </tr>
                    ) : (
                      bookings.map((book) => (
                        <tr key={book._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-850 dark:text-slate-200">{book.resource?.name}</span>
                              <span className={`w-fit mt-0.5 px-1.5 py-0.2 rounded text-[9px] border font-bold ${getResourceColor(book.resource?.category)}`}>
                                {book.resource?.category}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-650 dark:text-slate-350">
                            <div className="flex flex-col">
                              <span>{new Date(book.startTime).toLocaleDateString()}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(book.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(book.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-550 dark:text-slate-300">
                            {book.bookedBy?.name} ({book.bookedBy?.role})
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic">
                            {book.purpose}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {(book.bookedBy?._id === user._id || ['Admin', 'Asset Manager'].includes(user.role)) && (
                              <button
                                onClick={() => handleCancelBooking(book._id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border border-slate-200/50 dark:border-slate-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Schedule Checklist */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-enterprise dark:shadow-enterprise-dark">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">
              Upcoming Reservations
            </h3>
            
            <div className="flex flex-col gap-3">
              {bookings.filter(b => new Date(b.startTime) >= new Date()).slice(0, 4).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No upcoming meetings or resource bookings scheduled.</div>
              ) : (
                bookings
                  .filter(b => new Date(b.startTime) >= new Date())
                  .slice(0, 4)
                  .map((book) => (
                    <div 
                      key={book._id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                          {book.resource?.name}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] border font-bold uppercase ${getResourceColor(book.resource?.category)}`}>
                          {book.resource?.category}
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-slate-500 leading-normal italic">
                        "{book.purpose}"
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-850">
                        <span>{new Date(book.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span>{new Date(book.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Book Resource Modal Overlay */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Tag className="w-5 h-5 text-purple-500" />
                Reserve Shared Resource
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4 text-xs font-semibold text-slate-650 dark:text-slate-400">
              
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Resource Category</label>
                <select
                  value={selectedResourceType}
                  onChange={(e) => setSelectedResourceType(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="Meeting Room">Meeting Rooms</option>
                  <option value="Vehicle">Vehicles</option>
                  <option value="Projector">Projectors</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Select Specific Item</label>
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  required
                >
                  <option value="">-- Choose Resource --</option>
                  {resources.filter(r => r.category === selectedResourceType).map(res => (
                    <option key={res._id} value={res._id}>{res.name} ({res.location})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold uppercase">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold uppercase">Start Time</label>
                  <input
                    type="time"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold uppercase">End Time</label>
                  <input
                    type="time"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Purpose of Reservation</label>
                <input
                  type="text"
                  placeholder="e.g. Sales pitch, client site transport, HR open presentation"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold uppercase">Additional Notes</label>
                <textarea
                  placeholder="e.g. Need board adapter display keys, charger, loading access..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 min-h-[60px]"
                />
              </div>

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
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md shadow-purple-500/10 flex items-center justify-center"
                >
                  {submitting ? 'Confirming...' : 'Approve Booking'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
