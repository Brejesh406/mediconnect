import React, { useState } from 'react';
import { X, Shield, Lock, Mail, User, Phone, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const { login, register, demoLogin, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Firebase Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        email,
        password,
        fullName,
        phone,
        role,
        dateOfBirth,
        gender,
        bloodGroup,
        allergies,
        insuranceProvider,
        insurancePolicyNumber,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password recovery.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (targetRole: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(targetRole);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-teal-700 to-sky-800 text-white px-6 pt-6 pb-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="w-5 h-5 text-teal-300" />
            <span className="text-xs uppercase font-semibold tracking-wider text-teal-200">
              MediConnect Secure Access
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {mode === 'login' ? 'Sign In to Your Portal' : mode === 'register' ? 'Create Health Record Account' : 'Password Recovery'}
          </h2>
          <p className="text-xs text-teal-100 mt-1">
            {mode === 'login'
              ? 'Enter your credentials to access clinical or patient records.'
              : mode === 'register'
              ? 'Join MediConnect for centralized, verified healthcare access.'
              : 'Enter your registered email to receive access instructions.'}
          </p>
        </div>

        {/* 1-Click Fast Demo Switcher Bar */}
        <div className="bg-teal-50/70 border-b border-teal-100 px-6 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-teal-900 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" /> Instant Demo Access
            </span>
            <span className="text-[10px] text-teal-700">Pre-seeded accounts</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('patient')}
              disabled={loading}
              className="py-1 px-2 text-[11px] font-medium text-teal-950 bg-white border border-teal-200 rounded-md hover:bg-teal-100 transition-colors truncate shadow-2xs"
            >
              Patient Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemo('doctor')}
              disabled={loading}
              className="py-1 px-2 text-[11px] font-medium text-sky-950 bg-white border border-sky-200 rounded-md hover:bg-sky-100 transition-colors truncate shadow-2xs"
            >
              Doctor Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              disabled={loading}
              className="py-1 px-2 text-[11px] font-medium text-indigo-950 bg-white border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors truncate shadow-2xs"
            >
              Admin Demo
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Google Sign In with Firebase */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-semibold text-slate-600">
                    <span className="bg-white px-2">Or continue with credentials</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john.doe@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setMode('forgot');
                    }}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('register');
                  }}
                  className="font-semibold text-teal-700 hover:text-teal-900 underline"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg mb-2">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    role === 'patient' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patient Account
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    role === 'doctor' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Doctor / Clinician
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Jane Mitchell or John Smith"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {role === 'patient' && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Insurance Provider</label>
                      <input
                        type="text"
                        value={insuranceProvider}
                        onChange={(e) => setInsuranceProvider(e.target.value)}
                        placeholder="e.g. Blue Cross"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Policy / Member #</label>
                      <input
                        type="text"
                        value={insurancePolicyNumber}
                        onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                        placeholder="e.g. BCBS-99128"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Known Drug Allergies</label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g. Penicillin, Sulfa, None"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors mt-2"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>

              <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('login');
                  }}
                  className="font-semibold text-teal-700 hover:text-teal-900 underline"
                >
                  Sign In instead
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your account email"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                {loading ? 'Dispatching...' : 'Send Recovery Instructions'}
              </button>

              <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('login');
                  }}
                  className="font-semibold text-teal-700 hover:text-teal-900 underline"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
