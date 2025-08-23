import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: { role: 'admin' | 'group_leader'; groupName?: string; isAuthenticated: boolean }) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Vérification des identifiants
      if (username === 'admin' && password === 'JADYG2026') {
        const user = { role: 'admin' as const, groupName: undefined, isAuthenticated: true };
        // Sauvegarder dans localStorage
        localStorage.setItem('youth_auth', JSON.stringify(user));
        console.log('Admin connecté:', user);
        onLogin(user);
      } else if (username.startsWith('groupe_') && password === 'JADYG2026') {
        // Extraire le nom du groupe à partir du nom d'utilisateur
        const groupNameFromUsername = username.replace('groupe_', '').replace(/_/g, ' ');
        
        // Vérifier que le groupe existe
        const validGroups = [
          'Disciples',
          'Les Élus',
          'Sel et Lumière',
          'Porteurs de l\'Alliance',
          'Bergerie du Maître',
          'Vases d\'Honneur',
          'Sacerdoce Royal',
          'Flambeaux',
          'Serviteurs Fidèles',
          'Héritiers du Royaume'
        ];

        const normalizedGroupName = validGroups.find(group => 
          group.toLowerCase().replace(/['\s]/g, '') === groupNameFromUsername.toLowerCase().replace(/['\s]/g, '')
        );

        if (normalizedGroupName) {
          const user = { role: 'group_leader' as const, groupName: normalizedGroupName, isAuthenticated: true };
          // Sauvegarder dans localStorage
          localStorage.setItem('youth_auth', JSON.stringify(user));
          console.log('Responsable de groupe connecté:', user);
          onLogin(user);
        } else {
          setError('Groupe non reconnu. Vérifiez le nom d\'utilisateur.');
        }
      } else {
        setError('Identifiants incorrects');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">GestJADYG</h1>
          <p className="text-gray-600">Accès à l'espace d'administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="admin ou groupe_[nom_du_groupe]"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Entrez votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Instructions de connexion :</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Admin :</strong> username = "admin"</li>
              <li><strong>Responsable :</strong> username = "groupe_[nom]"</li>
              <li className="text-xs text-blue-600 mt-2">
                Exemple : "groupe_disciples" pour le groupe Disciples
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}