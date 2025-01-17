import type { Property } from '../../../types';

const mockProperty: Property = {
  id: 'property1',
  name: 'Test Property',
  type: 'Apartment',
  address: '123 Test Street',
  description: 'A test property'
};

export const propertyService = {
  fetchPropertyById: jest.fn().mockResolvedValue(mockProperty),
  fetchAllProperties: jest.fn().mockResolvedValue([mockProperty]),
  updateProperty: jest.fn().mockResolvedValue(mockProperty),
  createProperty: jest.fn().mockResolvedValue(mockProperty),
  deleteProperty: jest.fn().mockResolvedValue(true)
};
