import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DepartmentsView } from './components/views/DepartmentsView';
import { DoctorsView } from './components/views/DoctorsView';
import { SecurityView } from './components/views/SecurityView';
import { AuthModal } from './components/auth/AuthModal';
import { BookAppointmentModal } from './components/appointments/BookAppointmentModal';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  
  // Global modal controls
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookingDoctorId, setBookingDoctorId] = useState<string | undefined>(undefined);
  const [bookingDeptId, setBookingDeptId] = useState<string | undefined>(undefined);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleSelectDoctorForBooking = (doctorId: string, deptId?: string) => {
    setBookingDoctorId(doctorId);
    setBookingDeptId(deptId);
    setBookModalOpen(true);
  };

  const handleBookFromDepartment = (deptId?: string) => {
    setBookingDoctorId(undefined);
    setBookingDeptId(deptId);
    setBookModalOpen(true);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'departments':
        return (
          <DepartmentsView
            onSelectDoctor={handleSelectDoctorForBooking}
            onBookAppointment={handleBookFromDepartment}
          />
        );

      case 'doctors':
        return (
          <DoctorsView
            onSelectDoctor={handleSelectDoctorForBooking}
          />
        );

      case 'security':
        return <SecurityView />;

      case 'patient-dashboard':
        return user ? (
          <PatientDashboard />
        ) : (
          <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-2">Patient Authentication Required</h2>
            <p className="text-xs text-slate-500 mb-6">
              Please sign in or register to access personal clinical records, prescriptions, and appointment histories.
            </p>
            <button
              onClick={() => handleOpenAuth('login')}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
            >
              Sign In to Patient Portal
            </button>
          </div>
        );

      case 'doctor-dashboard':
        return user && user.role === 'doctor' ? (
          <DoctorDashboard />
        ) : (
          <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-2">Physician Access Restricted</h2>
            <p className="text-xs text-slate-500 mb-6">
              The clinical portal requires authorized medical staff credentials. Use the Demo Persona button in the header to preview.
            </p>
            <button
              onClick={() => handleOpenAuth('login')}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
            >
              Doctor Sign In
            </button>
          </div>
        );

      case 'admin-dashboard':
        return user && user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-2">Administrator Access Restricted</h2>
            <p className="text-xs text-slate-500 mb-6">
              Executive analytics and audit trail monitoring require administrative permissions. Use the Demo Persona switcher in the top bar.
            </p>
            <button
              onClick={() => handleOpenAuth('login')}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Admin Sign In
            </button>
          </div>
        );

      case 'profile':
        return user ? (
          <PatientDashboard />
        ) : (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onSelectDoctor={handleSelectDoctorForBooking}
            onSelectTab={setCurrentTab}
          />
        );

      case 'landing':
      default:
        return (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onSelectDoctor={handleSelectDoctorForBooking}
            onSelectTab={setCurrentTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuth={handleOpenAuth}
        onOpenBookAppointment={() => setBookModalOpen(true)}
      />

      <main className="flex-1">
        {renderContent()}
      </main>

      <Footer />

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          // Tab auto-routing happens in AuthContext or Header
        }}
      />

      <BookAppointmentModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        onSuccess={() => {
          if (user?.role === 'patient') {
            setCurrentTab('patient-dashboard');
          }
        }}
        preselectedDoctorId={bookingDoctorId}
        preselectedDepartmentId={bookingDeptId}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
