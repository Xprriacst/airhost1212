import type { Property, Conversation } from '../../types';

export const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Demo Property',
    address: '123 Demo Street',
    accessCodes: {
      wifi: {
        name: 'Demo_WiFi',
        password: 'demo123'
      },
      door: '1234'
    },
    houseRules: ['No smoking', 'No parties'],
    amenities: ['WiFi', 'Kitchen'],
    checkInTime: '15:00',
    checkOutTime: '11:00',
    maxGuests: 4,
    photos: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6'],
    description: 'A demo property for development',
    restaurants: ['Demo Restaurant'],
    fastFood: ['Demo Fast Food'],
    emergencyContacts: ['+1234567890']
  }
];

export const createMockConversation = (propertyId: string): Conversation => ({
  id: Date.now().toString(),
  propertyId,
  guestName: 'Demo Guest',
  guestEmail: 'demo@example.com',
  checkIn: '2024-03-15',
  checkOut: '2024-03-20',
  messages: [
    { 
      id: '1',
      text: 'Welcome to your stay!',
      isUser: true,
      timestamp: new Date(),
      sender: 'Host'
    }
  ]
});