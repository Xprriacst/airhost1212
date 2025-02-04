import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhatsAppBusinessSetup } from '../WhatsAppBusinessSetup';
import { userService } from '../../../services/airtable/userService';
import { vi } from 'vitest';

// Mock du service userService
vi.mock('../../../services/airtable/userService', () => ({
  userService: {
    getWhatsAppConfig: vi.fn(),
    updateWhatsAppConfig: vi.fn()
  }
}));

describe('WhatsAppBusinessSetup', () => {
  const mockUserId = 'test-user-123';
  const mockConfig = {
    phoneNumberId: '461158110424411',
    appId: '123456789',
    accessToken: 'test-token',
    verifyToken: 'test-verify-token',
    displayName: 'Test Property',
    businessId: 'test-business-id'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger la configuration existante', async () => {
    (userService.getWhatsAppConfig as jest.Mock).mockResolvedValueOnce(mockConfig);

    render(<WhatsAppBusinessSetup userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockConfig.displayName)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockConfig.phoneNumberId)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockConfig.appId)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockConfig.businessId)).toBeInTheDocument();
    });
  });

  it('devrait afficher un formulaire vide si pas de configuration existante', async () => {
    (userService.getWhatsAppConfig as jest.Mock).mockResolvedValueOnce(null);

    render(<WhatsAppBusinessSetup userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Villa Bella - Service Client/)).toHaveValue('');
      expect(screen.getByPlaceholderText(/461158110424411/)).toHaveValue('');
    });
  });

  it('devrait sauvegarder la nouvelle configuration', async () => {
    (userService.getWhatsAppConfig as jest.Mock).mockResolvedValueOnce(null);
    (userService.updateWhatsAppConfig as jest.Mock).mockResolvedValueOnce(undefined);

    const onConfigurationComplete = vi.fn();
    render(
      <WhatsAppBusinessSetup 
        userId={mockUserId} 
        onConfigurationComplete={onConfigurationComplete} 
      />
    );

    // Attendre que le formulaire soit chargé
    await waitFor(() => {
      expect(screen.getByText('Configuration WhatsApp Business')).toBeInTheDocument();
    });

    // Remplir le formulaire
    fireEvent.change(screen.getByPlaceholderText(/Villa Bella - Service Client/), {
      target: { value: mockConfig.displayName }
    });
    fireEvent.change(screen.getByPlaceholderText(/461158110424411/), {
      target: { value: mockConfig.phoneNumberId }
    });
    fireEvent.change(screen.getByPlaceholderText(/123456789/), {
      target: { value: mockConfig.appId }
    });
    fireEvent.change(screen.getByPlaceholderText(/987654321/), {
      target: { value: mockConfig.businessId }
    });
    fireEvent.change(screen.getByPlaceholderText(/Token de vérification personnalisé/), {
      target: { value: mockConfig.verifyToken }
    });

    // Soumettre le formulaire
    fireEvent.click(screen.getByText('Enregistrer la configuration'));

    await waitFor(() => {
      expect(userService.updateWhatsAppConfig).toHaveBeenCalledWith(mockUserId, expect.objectContaining({
        displayName: mockConfig.displayName,
        phoneNumberId: mockConfig.phoneNumberId,
        appId: mockConfig.appId,
        businessId: mockConfig.businessId,
        verifyToken: mockConfig.verifyToken
      }));
      expect(onConfigurationComplete).toHaveBeenCalled();
    });
  });

  it('devrait afficher une erreur en cas d\'échec du chargement', async () => {
    (userService.getWhatsAppConfig as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    render(<WhatsAppBusinessSetup userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement de la configuration')).toBeInTheDocument();
    });
  });

  it('devrait afficher une erreur en cas d\'échec de la sauvegarde', async () => {
    (userService.getWhatsAppConfig as jest.Mock).mockResolvedValueOnce(null);
    (userService.updateWhatsAppConfig as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    render(<WhatsAppBusinessSetup userId={mockUserId} />);

    // Soumettre le formulaire avec des données minimales
    fireEvent.change(screen.getByPlaceholderText(/Villa Bella - Service Client/), {
      target: { value: 'Test' }
    });
    fireEvent.click(screen.getByText('Enregistrer la configuration'));

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de la sauvegarde de la configuration')).toBeInTheDocument();
    });
  });
});
