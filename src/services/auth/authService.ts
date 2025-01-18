import { base } from '../airtable/config';
import { LoginCredentials, RegisterCredentials, User } from '../../types';
import bcrypt from 'bcryptjs';

export class AuthService {
  private static TABLE_NAME = 'Users';

  static async register(credentials: RegisterCredentials): Promise<User> {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUsers = await base(this.TABLE_NAME)
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
      const records = await base(this.TABLE_NAME).create([
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
      
      return {
        id: record.id,
        email: record.fields.email as string,
        name: record.fields.name as string,
        role: record.fields.role as 'admin' | 'user',
        createdAt: record.fields.createdAt as string,
      };
    } catch (error) {
      throw new Error(`Erreur lors de l'inscription: ${error.message}`);
    }
  }

  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      const records = await base(this.TABLE_NAME)
        .select({
          filterByFormula: `{email} = '${credentials.email}'`,
        })
        .firstPage();

      if (records.length === 0) {
        throw new Error('Email ou mot de passe incorrect');
      }

      const record = records[0];
      const isValidPassword = await bcrypt.compare(
        credentials.password,
        record.fields.password as string
      );

      if (!isValidPassword) {
        throw new Error('Email ou mot de passe incorrect');
      }

      return {
        id: record.id,
        email: record.fields.email as string,
        name: record.fields.name as string,
        role: record.fields.role as 'admin' | 'user',
        createdAt: record.fields.createdAt as string,
      };
    } catch (error) {
      throw new Error(`Erreur lors de la connexion: ${error.message}`);
    }
  }

  static getUsers(query: { filterByFormula?: string; fields?: string[] }) {
    return base(this.TABLE_NAME).select(query);
  }
}

export const authService = new AuthService();
