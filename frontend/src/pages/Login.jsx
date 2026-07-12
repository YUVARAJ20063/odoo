import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Laptop, Lock, Mail, Eye, EyeOff, Shield, RefreshCw, Key, User, Phone, Briefcase, Building2 } from 'lucide-react';

export const Login = () => {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  
  // view can be: 'login', 'signup', 'reset'
  const [view, setView] = useState('login');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupDept, setSignupDept] = useState('');
  const [signupDesignation, setSignupDesignation] = useState('');
  const [departments, setDepartments] = useState([]);

  const navigate = useNavigate();

  // Fetch departments for signup dropdown
  useEffect(() => {
    const fetchDeptsForSignup = async () => {
      try {
        const res = await fetch('https://heavy-cars-bake.loca.lt/api/departments/public');
        if (res.ok) {
          const data = await res.json();
          setDepartments(data || []);
          if (data && data.length > 0) {
            setSignupDept(data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDeptsForSignup();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await login(email, password);
    setLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupName || !email || !password) {
      setError('Please fill in Name, Email and Password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await signup({
      name: signupName,
      email,
      password,
      phone: signupPhone,
      department: signupDept || null,
      designation: signupDesignation || 'Employee'
    });
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Signup failed');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    setLoading(true);
    try {
      const res = await fetch('https://heavy-cars-bake.loca.lt/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      setResetSent(data.message);
    } catch (err) {
      setError('Connection failure.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill logins for Hackathon ease of use!
  const fillRole = (roleEmail, rolePass) => {
    setView('login');
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] p-4 font-sans relative overflow-hidden">
      
      {/* Background glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-8 z-10 transition-all max-h-[95vh] overflow-y-auto">
        
        {/* Logo and Greeting */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md mb-3">
            <Laptop className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-sans">
            AssetFlow Portal
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium uppercase tracking-wider">
            {view === 'signup' ? 'Create an Employee Account' : 'Enterprise Asset Management'}
          </p>
        </div>

        {/* System Error Box */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Dynamic Views */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 focus:border-blue-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setView('reset')}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 focus:border-blue-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign in Trigger */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Sign In to Account'
              )}
            </button>

            {/* Link to Signup */}
            <div className="text-center mt-2 text-xs font-semibold text-slate-550 dark:text-slate-400">
              New to AssetFlow?{' '}
              <button
                type="button"
                onClick={() => { setView('signup'); setError(''); }}
                className="text-blue-500 hover:text-blue-700 hover:underline"
              >
                Create an account
              </button>
            </div>

            {/* Hackathon Fast-Logins Sandbox */}
            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
              <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2">
                Fast Sign-In Presets
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillRole('admin@assetflow.com', 'admin123')}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-800"
                >
                  <Shield className="w-3 h-3 text-red-500" /> Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillRole('manager@assetflow.com', 'manager123')}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-800"
                >
                  <Key className="w-3 h-3 text-blue-500" /> Manager
                </button>
                <button
                  type="button"
                  onClick={() => fillRole('head@assetflow.com', 'head123')}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-800"
                >
                  <Shield className="w-3 h-3 text-purple-500" /> Dept Head
                </button>
                <button
                  type="button"
                  onClick={() => fillRole('employee@assetflow.com', 'employee123')}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-800"
                >
                  <Lock className="w-3 h-3 text-emerald-500" /> Employee
                </button>
              </div>
            </div>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3">
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 focus:border-blue-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 focus:border-blue-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 focus:border-blue-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Department (Dropdown) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Building2 className="w-4 h-4" />
                </span>
                <select
                  value={signupDept}
                  onChange={(e) => setSignupDept(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 focus:border-blue-500 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="">Select a Department (Optional)</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Designation */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Designation</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={signupDesignation}
                  onChange={(e) => setSignupDesignation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 focus:border-blue-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 focus:border-blue-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Signup Trigger */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account & Sign In'
              )}
            </button>

            {/* Link back to Login */}
            <button
              type="button"
              onClick={() => { setView('login'); setError(''); }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250">Reset Password</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal">
              Enter your email and we'll generate a mock authentication override instructions link for validation.
            </p>

            {resetSent && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-xl text-xs dark:bg-emerald-950/20 dark:text-emerald-400">
                {resetSent}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 focus:border-blue-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              Generate Reset Link
            </button>

            <button
              type="button"
              onClick={() => { setView('login'); setResetSent(''); }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1"
            >
              Back to Sign In
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
