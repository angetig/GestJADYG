import { useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import GroupLeaderDashboard from './components/GroupLeaderDashboard';
import LoginForm from './components/LoginForm';
import YouthRegistrationForm from './components/YouthRegistrationForm';
import AttendanceScanner from './components/AttendanceScanner';
import { AuthService } from './utils/auth';
import { AuthUser } from './types';
import { Users, Shield, QrCode } from 'lucide-react';

const HEADER_LOGO_LEFT = '/logo-left.png';
const HEADER_LOGO_RIGHT = '/logo-right.png';

function Header() {
  return (
    <header className="fixed top-0 left-0 w-full flex items-center justify-between bg-white shadow px-6 py-2 z-50">
      <img src={HEADER_LOGO_LEFT} alt="Logo gauche" className="h-12 w-auto" />
      <img src={HEADER_LOGO_RIGHT} alt="Logo droite" className="h-12 w-auto" />
    </header>
  );
}

function App() {
  const [currentView, setCurrentView] = useState<'form' | 'admin' | 'group_leader' | 'login'>('form');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(AuthService.getCurrentUser());
  const [showAttendanceScanner, setShowAttendanceScanner] = useState(false);

  const handleLogin = (user: AuthUser) => {
    console.log('handleLogin appelé avec:', user);
    setCurrentUser(user);
    if (user.role === 'admin') {
      console.log('Redirection vers admin dashboard');
      setCurrentView('admin');
    } else if (user.role === 'group_leader') {
      console.log('Redirection vers group leader dashboard pour le groupe:', user.groupName);
      setCurrentView('group_leader');
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setCurrentView('form');
  };

  const handleAdminAccess = () => {
    if (currentUser?.isAuthenticated) {
      setCurrentView(currentUser.role === 'admin' ? 'admin' : 'group_leader');
    } else {
      setCurrentView('login');
    }
  };

  return (
    <>
      <Header />
  <div className="min-h-screen pt-14">
        {currentView === 'login' && (
          <LoginForm onLogin={handleLogin} />
        )}
        {currentView === 'form' && (
          <>
            <div className="fixed top-16 right-4 z-10 flex gap-2">
              {currentUser?.role === 'group_leader' && (
                <button
                  onClick={() => setShowAttendanceScanner(true)}
                  className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
                  title="Scanner de présence"
                >
                  <QrCode size={20} />
                </button>
              )}
              <button
                onClick={handleAdminAccess}
                className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
                title="Administration"
              >
                <Shield size={20} />
              </button>
            </div>
            <YouthRegistrationForm />
          </>
        )}
        {currentView === 'admin' && (
          <>
            <div className="fixed top-16 right-4 z-10">
              <button
                onClick={() => setCurrentView('form')}
                className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                title="Retour au formulaire"
              >
                <Users size={20} />
              </button>
            </div>
            <AdminDashboard onLogout={handleLogout} />
          </>
        )}
        {currentView === 'group_leader' && (
          <>
            <div className="fixed top-16 right-4 z-10">
              <button
                onClick={() => setCurrentView('form')}
                className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                title="Retour au formulaire"
              >
                <Users size={20} />
              </button>
            </div>
            <GroupLeaderDashboard onLogout={handleLogout} />
          </>
        )}

        {/* Attendance Scanner Modal */}
        {showAttendanceScanner && (
          <AttendanceScanner onClose={() => setShowAttendanceScanner(false)} />
        )}
      </div>
    </>
  );
}

export default App;