import { User, Property, Conversation } from '../types';
import { userPropertyService } from './airtable/userPropertyService';

class AuthorizationService {
  // Cache des propriétés utilisateur pour éviter trop d'appels à Airtable
  private cache: Map<string, { properties: any[], timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async getUserPropertiesWithCache(userId: string) {
    const cached = this.cache.get(userId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.properties;
    }

    const properties = await userPropertyService.getUserProperties(userId);
    this.cache.set(userId, { properties, timestamp: now });
    return properties;
  }

  // Vérifie si un utilisateur a accès à une propriété
  async canAccessProperty(userId: string, propertyId: string): Promise<boolean> {
    const userProps = await this.getUserPropertiesWithCache(userId);
    return userProps.some(prop => prop.propertyId === propertyId);
  }

  // Vérifie si un utilisateur a accès à une conversation
  async canAccessConversation(userId: string, conversation: Conversation): Promise<boolean> {
    return this.canAccessProperty(userId, conversation.propertyId);
  }

  // Vérifie le rôle d'un utilisateur sur une propriété
  async getUserRole(userId: string, propertyId: string): Promise<'owner' | 'manager' | 'viewer' | null> {
    const userProps = await this.getUserPropertiesWithCache(userId);
    const prop = userProps.find(p => p.propertyId === propertyId);
    return prop ? prop.role : null;
  }

  // Filtre les propriétés accessibles à l'utilisateur
  async filterAccessibleProperties(userId: string, properties: Property[]): Promise<Property[]> {
    const userProps = await this.getUserPropertiesWithCache(userId);
    return properties.filter(property => 
      userProps.some(userProp => userProp.propertyId === property.id)
    );
  }

  // Filtre les conversations accessibles à l'utilisateur
  async filterAccessibleConversations(userId: string, conversations: Conversation[]): Promise<Conversation[]> {
    const userProps = await this.getUserPropertiesWithCache(userId);
    return conversations.filter(conversation =>
      userProps.some(userProp => userProp.propertyId === conversation.propertyId)
    );
  }

  // Ajoute une propriété à un utilisateur
  async addPropertyAccess(userId: string, propertyId: string, role: 'owner' | 'manager' | 'viewer' = 'viewer', createdBy: string): Promise<void> {
    await userPropertyService.addUserProperty({
      userId,
      propertyId,
      role,
      createdBy
    });
    this.cache.delete(userId); // Invalide le cache
  }

  // Retire l'accès d'une propriété à un utilisateur
  async removePropertyAccess(userId: string, propertyId: string): Promise<void> {
    await userPropertyService.removeUserProperty(userId, propertyId);
    this.cache.delete(userId); // Invalide le cache
  }

  // Met à jour le rôle d'un utilisateur sur une propriété
  async updatePropertyRole(userId: string, propertyId: string, role: 'owner' | 'manager' | 'viewer'): Promise<void> {
    await userPropertyService.updateUserPropertyRole(userId, propertyId, role);
    this.cache.delete(userId); // Invalide le cache
  }
}

export const authorizationService = new AuthorizationService();
