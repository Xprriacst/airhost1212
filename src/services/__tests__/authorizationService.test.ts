import { describe, expect, it, beforeEach, vi } from 'vitest';
import { authorizationService } from '../auth/authorizationService';
import { authService } from '../auth/authService';
import { base } from '../airtable/config';

vi.mock('../airtable/config', () => ({
  base: {
    'Properties': vi.fn(),
    'Users': vi.fn(),
    'UserProperties': vi.fn(),
    'Conversations': vi.fn(),
  }
}));

describe('AuthorizationService', () => {
  const testUser = {
    id: 'user123',
    email: 'test@gmail.com',
    name: 'Test User',
    role: 'user'
  };

  const mockProperties = [
    { id: 'prop1', fields: { Name: 'Property 1' } },
    { id: 'prop2', fields: { Name: 'Property 2' } }
  ];

  const mockConversations = [
    { id: 'conv1', fields: { PropertyId: 'prop1' } },
    { id: 'conv2', fields: { PropertyId: 'prop2' } }
  ];

  const mockUserProperties = [
    { id: 'up1', fields: { UserId: 'user123', PropertyId: 'prop1', Role: 'owner' } }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(testUser);
  });

  describe('filterAccessibleProperties', () => {
    it('should return only properties the user has access to', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        firstPage: vi.fn().mockResolvedValue(mockUserProperties)
      });
      vi.mocked(base.UserProperties).mockReturnValue({ select: mockSelect });

      const result = await authorizationService.filterAccessibleProperties(
        testUser.id,
        mockProperties
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('prop1');
    });

    it('should return empty array if user has no properties', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        firstPage: vi.fn().mockResolvedValue([])
      });
      vi.mocked(base.UserProperties).mockReturnValue({ select: mockSelect });

      const result = await authorizationService.filterAccessibleProperties(
        testUser.id,
        mockProperties
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('filterAccessibleConversations', () => {
    it('should return only conversations from properties the user has access to', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        firstPage: vi.fn().mockResolvedValue(mockUserProperties)
      });
      vi.mocked(base.UserProperties).mockReturnValue({ select: mockSelect });

      const result = await authorizationService.filterAccessibleConversations(
        testUser.id,
        mockConversations
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('conv1');
    });

    it('should return empty array if user has no access to any properties', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        firstPage: vi.fn().mockResolvedValue([])
      });
      vi.mocked(base.UserProperties).mockReturnValue({ select: mockSelect });

      const result = await authorizationService.filterAccessibleConversations(
        testUser.id,
        mockConversations
      );

      expect(result).toHaveLength(0);
    });
  });
});
