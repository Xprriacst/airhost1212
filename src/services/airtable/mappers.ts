import type { Property, Conversation } from '../../types';

export function mapRecordToProperty(record: any): Property {
  return {
    id: record.id,
    description: record.get('Description'),
    photos: record.get('Photos'),
    aiInstructions: record.get('AI Instructions'),
    autoPilot: record.get('Auto Pilot'),
    conversations: record.get('Conversations')
  };
}

export function mapRecordToConversation(record: any): Conversation {
  return {
    id: record.id,
    fields: {
      Properties: record.get('Properties'),
      'Guest Name': record.get('Guest Name'),
      'Guest First Name': record.get('Guest First Name'),
      'Guest Last Name': record.get('Guest Last Name'),
      'Guest Email': record.get('Guest Email'),
      Messages: record.get('Messages'),
      'Check-in': record.get('Check-in')
    }
  };
}