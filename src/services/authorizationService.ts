import { Property, Conversation } from '../types';
import { User } from '../types/auth';
import { userPropertyService } from './airtable/userPropertyService';

class AuthorizationService {
  // Cache des propriétés utilisateur pour éviter trop d'appels à Airtable
  private cache: Map<string, { properties: any[], timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async getUserPropertiesWithCache(userId: string) {
    console.log(`[Auth] Fetching properties for user ${userId}`);
    const cached = this.cache.get(userId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`[Auth] Using cached properties for user ${userId}:`, cached.properties);
      return cached.properties;
    }

    const properties = await userPropertyService.getUserProperties(userId);
    console.log(`[Auth] Fresh properties fetched for user ${userId}:`, properties);
    this.cache.set(userId, { properties, timestamp: now });
    return properties;
  }

  // Vérifie si un utilisateur a accès à une propriété
  async canAccessProperty(userId: string, propertyId: string): Promise<boolean> {
    const userProps = await this.getUserPropertiesWithCache(userId);
    const hasAccess = userProps.some(prop => prop.propertyId === propertyId);
    console.log(`[Auth] User ${userId} access to property ${propertyId}: ${hasAccess}`);
    return hasAccess;
  }

  // Vérifie si un utilisateur a accès à une conversation
  async canAccessConversation(userId: string, conversation: Conversation): Promise<boolean> {
    const hasAccess = await this.canAccessProperty(userId, conversation.propertyId);
    console.log(`[Auth] User ${userId} access to conversation ${conversation.id}: ${hasAccess}`);
    return hasAccess;
  }

  // Vérifie le rôle d'un utilisateur sur une propriété
  async getUserRole(userId: string, propertyId: string): Promise<'owner' | 'manager' | 'viewer' | null> {
    const userProps = await this.getUserPropertiesWithCache(userId);
    const prop = userProps.find(p => p.propertyId === propertyId);
    console.log(`[Auth] User ${userId} role for property ${propertyId}: ${prop?.role || 'none'}`);
    return prop ? prop.role : null;
  }

  // Filtre les propriétés accessibles à l'utilisateur
  async filterAccessibleProperties(userId: string, properties: Property[]): Promise<Property[]> {
    const userProps = await this.getUserPropertiesWithCache(userId);
    const filteredProperties = properties.filter(property => 
      userProps.some(userProp => userProp.propertyId === property.id)
    );
    console.log(`[Auth] Filtered properties for user ${userId}: ${filteredProperties.length}/${properties.length}`);
    return filteredProperties;
  }

  // Filtre les conversations accessibles à l'utilisateur
  async filterAccessibleConversations(userId: string, conversations: Conversation[]): Promise<Conversation[]> {
    const userProps = await this.getUserPropertiesWithCache(userId);
    const filteredConversations = conversations.filter(conversation =>
      userProps.some(userProp => userProp.propertyId === conversation.propertyId)
    );
    console.log(`[Auth] Filtered conversations for user ${userId}: ${filteredConversations.length}/${conversations.length}`);
    return filteredConversations;
  }

  // Ajoute une propriété à un utilisateur
  async addPropertyAccess(userId: string, propertyId: string, role: 'owner' | 'manager' | 'viewer' = 'viewer', createdBy: string): Promise<void> {
    console.log(`[Auth] Adding property ${propertyId} access for user ${userId} with role ${role}`);
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
    console.log(`[Auth] Removing property ${propertyId} access for user ${userId}`);
    await userPropertyService.removeUserProperty(userId, propertyId);
    this.cache.delete(userId); // Invalide le cache
  }

  // Met à jour le rôle d'un utilisateur sur une propriété
  async updatePropertyRole(userId: string, propertyId: string, role: 'owner' | 'manager' | 'viewer'): Promise<void> {
    console.log(`[Auth] Updating role to ${role} for user ${userId} on property ${propertyId}`);
    await userPropertyService.updateUserPropertyRole(userId, propertyId, role);
    this.cache.delete(userId); // Invalide le cache
  }
}

export const authorizationService = new AuthorizationService();
