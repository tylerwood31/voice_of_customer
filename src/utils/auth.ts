export interface User {
  email: string;
  role: 'admin' | 'super_admin';
  name: string;
}

// Hardcoded users for demo
export const USERS: Record<string, { password: string; user: User }> = {
  'admin@coverwallet.com': {
    password: 'coverwallet2025',
    user: {
      email: 'admin@coverwallet.com',
      role: 'admin',
      name: 'Admin User'
    }
  },
  'tyler.wood@coverwallet.com': {
    password: 'superadmin2025',
    user: {
      email: 'tyler.wood@coverwallet.com',
      role: 'super_admin',
      name: 'Tyler Wood'
    }
  }
};

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const userData = await response.json();
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('voc_auth_token');
  const userData = localStorage.getItem('voc_user_data');
  
  if (token === 'authenticated' && userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  
  return null;
}

export function isSuperAdmin(user: User | null): boolean {
  return user?.role === 'super_admin';
}