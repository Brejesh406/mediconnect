import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NotificationsModal } from './NotificationsModal';
import { Bell, LogOut, User, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenBookAppointment?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenBookAppointment,
}) => {
  const { user, logout, demoLogin, unreadCount } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const handleDemoSwitch = async (role: UserRole) => {
    setShowDemoMenu(false);
    setShowUserMenu(false);
    await demoLogin(role);
    if (role === 'patient') onSelectTab('patient-dashboard');
    else if (role === 'doctor') onSelectTab('doctor-dashboard');
    else if (role === 'admin') onSelectTab('admin-dashboard');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <button
            onClick={() => onSelectTab(user ? (user.role === 'doctor' ? 'doctor-dashboard' : user.role === 'admin' ? 'admin-dashboard' : 'patient-dashboard') : 'landing')}
            className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold shadow-xs transition-transform group-hover:scale-105">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                MediConnect
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Hospital System
              </span>
            </div>
          </button>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('landing')}
              className={`hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'landing' ? 'text-teal-700 font-semibold' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onSelectTab('departments')}
              className={`hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'departments' ? 'text-teal-700 font-semibold' : ''
              }`}
            >
              Departments
            </button>
            <button
              onClick={() => onSelectTab('doctors')}
              className={`hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'doctors' ? 'text-teal-700 font-semibold' : ''
              }`}
            >
              Specialists
            </button>
            {user && (
              <button
                onClick={() => {
                  if (user.role === 'doctor') onSelectTab('doctor-dashboard');
                  else if (user.role === 'admin') onSelectTab('admin-dashboard');
                  else onSelectTab('patient-dashboard');
                }}
                className={`hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 ${
                  currentTab.includes('dashboard') ? 'text-teal-700 font-semibold' : ''
                }`}
              >
                {user.role === 'doctor' ? 'Clinical Portal' : user.role === 'admin' ? 'Hospital Admin' : 'Health Portal'}
              </button>
            )}
            <button
              onClick={() => onSelectTab('security')}
              className={`hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'security' ? 'text-teal-700 font-semibold' : ''
              }`}
            >
              Compliance & RLS
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action & User Session */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Demo Switcher (Crucial for instant role testing) */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap shrink-0"
                title="Switch test persona"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Demo Persona</span>
                <ChevronDown className="w-3 h-3 text-teal-600" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                    Switch Test Account
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('patient')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-medium text-slate-900">Patient: John Doe</div>
                      <div className="text-[11px] text-slate-500">Hypertension · Records · Appointments</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('doctor')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-medium text-slate-900">Doctor: Dr. Sarah Jensen</div>
                      <div className="text-[11px] text-slate-500">Cardiology Chief · Clinical Notes</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('admin')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-medium text-slate-900">Admin: Hospital Supervisor</div>
                      <div className="text-[11px] text-slate-500">Analytics · Roster · Audit Logs</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                {/* Notifications Bell */}
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors"
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                        {user.fullName}
                      </span>
                      <span className="text-[10px] text-teal-700 font-medium capitalize">
                        {user.role}
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-medium text-xs">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-full h-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="font-semibold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (user.role === 'doctor') onSelectTab('doctor-dashboard');
                          else if (user.role === 'admin') onSelectTab('admin-dashboard');
                          else onSelectTab('patient-dashboard');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSelectTab('profile');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
                      >
                        Account & Profile
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={async () => {
                          setShowUserMenu(false);
                          await logout();
                          onSelectTab('landing');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNavigate={(link) => {
          if (link.includes('appointment')) {
            onSelectTab(user?.role === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard');
          } else if (link.includes('record') || link.includes('prescription')) {
            onSelectTab(user?.role === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard');
          }
        }}
      />
    </>
  );
};
