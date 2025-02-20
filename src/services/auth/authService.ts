import { base } from '../airtable/config';
import type { LoginCredentials, RegisterCredentials, User } from '../../types';
import bcrypt from 'bcryptjs';

class AuthService {
  private static TABLE_NAME = 'Users';
  private currentUser: User | null = null;

  getCurrentUser(): User | null {
    if (!this.currentUser) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    }
    return this.currentUser;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('user');
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUsers = await base(AuthService.TABLE_NAME)
        .select({
          filterByFormula: `{email} = '${credentials.email}'`,
        })
        .firstPage();

      if (existingUsers.length > 0) {
        throw new Error('User already exists');
      }

      // Hasher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(credentials.password, salt);

      // Créer l'utilisateur
      const records = await base(AuthService.TABLE_NAME).create([
        {
          fields: {
            email: credentials.email,
            name: credentials.name,
            role: 'user',
            password: hashedPassword,
            createdAt: new Date().toISOString(),
          },
        },
      ]);

      const user = {
        id: records[0].id,
        email: records[0].get('email') as string,
        name: records[0].get('name') as string,
        role: records[0].get('role') as string,
        createdAt: records[0].get('createdAt') as string,
      };

      console.log('[Auth] Created user with ID:', user.id);
      this.currentUser = user;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      // Rechercher l'utilisateur par email
      const records = await base(AuthService.TABLE_NAME)
        .select({
          filterByFormula: `{email} = '${credentials.email}'`,
        })
        .firstPage();

      if (records.length === 0) {
        throw new Error('User not found');
      }

      const user = {
        id: records[0].id,
        email: records[0].get('email') as string,
        name: records[0].get('name') as string,
        role: records[0].get('role') as string,
        createdAt: records[0].get('createdAt') as string,
      };

      // Vérifier le mot de passe
      const isValid = await bcrypt.compare(
        credentials.password,
        records[0].get('password') as string
      );

      if (!isValid) {
        throw new Error('Invalid password');
      }

      console.log('[Auth] User ID:', user.id);
      this.currentUser = user;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  getUsers(query: { filterByFormula?: string; fields?: string[] }) {
    return base(AuthService.TABLE_NAME).select(query);
  }
}

export const authService = new AuthService();
