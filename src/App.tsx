import React, { useState } from 'react';
import YouthRegistrationForm from './components/YouthRegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import GroupLeaderDashboard from './components/GroupLeaderDashboard';
import LoginForm from './components/LoginForm';
import { AuthService } from './utils/auth';
import { AuthUser } from './types';
import { Users, Settings, Shield } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'form' | 'admin' | 'group_leader' | 'login'>('form');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(AuthService.getCurrentUser());

  const handleLogin = (user: AuthUser) => {
    console.log('handleLogin appelé avec:', user);
    setCurrentUser(user);
    if (user.role === 'admin') {
      console.log('Redirection vers admin dashboard');
      return (
        <div className="min-h-screen">
          <Header />
      <div className="pt-32"> {/* Augmente encore le padding-top pour que le titre soit bien visible */}
            {currentView === 'login' && (
              <LoginForm onLogin={handleLogin} />
            )}
        
            {currentView === 'form' && (
              <>
                <div className="fixed top-4 right-4 z-10">
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
                <div className="fixed top-4 right-4 z-10">
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
                <div className="fixed top-4 right-4 z-10">
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
          </div>
        </div>
      );
      
      {currentView === 'admin' && (
        <>
          <div className="fixed top-4 right-4 z-10">
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
          <div className="fixed top-4 right-4 z-10">
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
    </div>
  );
}

export default App;