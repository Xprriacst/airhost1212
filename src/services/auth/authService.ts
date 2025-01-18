import { base } from '../airtable/config';
import { LoginCredentials, RegisterCredentials, User } from '../../types';
import bcrypt from 'bcryptjs';

class AuthService {
  private static TABLE_NAME = 'Users';
  private currentUser: User | null = null;

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
  }

  logout() {
    this.currentUser = null;
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
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      // Hasher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(credentials.password, salt);

      // Créer l'utilisateur
      const records = await base(AuthService.TABLE_NAME).create([
        {
          fields: {
            email: credentials.email,
            password: hashedPassword,
            name: credentials.name,
            role: 'user',
            createdAt: new Date().toISOString(),
          },
        },
      ]);

      const record = records[0];
      const user = {
        id: record.id,
        email: record.fields.email as string,
        name: record.fields.name as string,
        role: record.fields.role as 'admin' | 'user',
        createdAt: record.fields.createdAt as string,
      };

      console.log('[Auth] Created user with ID:', user.id);
      this.setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Error registering user:', error);
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
        throw new Error('Email ou mot de passe incorrect');
      }

      const record = records[0];
      const user = {
        id: record.id,
        email: record.fields.email as string,
        name: record.fields.name as string,
        role: record.fields.role as 'admin' | 'user',
        createdAt: record.fields.createdAt as string,
      };

      // Vérifier le mot de passe
      const isValid = await bcrypt.compare(
        credentials.password,
        record.fields.password as string
      );

      if (!isValid) {
        throw new Error('Email ou mot de passe incorrect');
      }

      console.log('[Auth] User ID:', user.id);
      this.setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  getUsers(query: { filterByFormula?: string; fields?: string[] }) {
    return base(AuthService.TABLE_NAME).select(query);
  }
}

export const authService = new AuthService();
