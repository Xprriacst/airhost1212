import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { fetch, Request, Response } from 'cross-fetch';
import { vi, beforeEach } from 'vitest';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
global.fetch = fetch;
global.Request = Request as any;
global.Response = Response as any;

// Configuration globale des mocks
vi.mock('./services/airtable/conversationService', () => ({
  conversationService: {
    createOrUpdateConversation: vi.fn(),
    findConversationByPhone: vi.fn(),
    sendMessage: vi.fn(),
  }
}));

// Réinitialisation des mocks après chaque test
beforeEach(() => {
  vi.clearAllMocks();
});
