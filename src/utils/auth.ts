import { AuthUser, DEFAULT_PASSWORD, YOUTH_GROUPS } from '../types';

export class AuthService {
  private static readonly AUTH_KEY = 'youth_auth';
  
  static login(role: 'admin' | 'group_leader', groupName?: string, password?: string): { success: boolean; message: string; user?: AuthUser } {
    if (password !== DEFAULT_PASSWORD) {
      return {
        success: false,
        message: 'Mot de passe incorrect'
      };
    }
    
    if (role === 'group_leader' && (!groupName || !YOUTH_GROUPS.includes(groupName as any))) {
      return {
        success: false,
        message: `Groupe invalide: ${groupName}. Groupes valides: ${YOUTH_GROUPS.join(', ')}`
      };
    }
    
    const user: AuthUser = {
      role,
      groupName: role === 'group_leader' ? groupName : undefined,
      isAuthenticated: true
    };
    
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
    
    return {
      success: true,
      message: role === 'group_leader' ? `Connexion réussie au groupe ${groupName}` : 'Connexion réussie',
      user
    };
  }
  
  static logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
  }
  
  static getCurrentUser(): AuthUser | null {
    const stored = localStorage.getItem(this.AUTH_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  
  static isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return user?.isAuthenticated || false;
  }
  
  static isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || false;
  }
  
  static isGroupLeader(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'group_leader' || false;
  }
  
  static getUserGroup(): string | undefined {
    const user = this.getCurrentUser();
    return user?.groupName;
  }
}