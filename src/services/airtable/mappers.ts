import type { Property, AIInstruction } from '../../types';

export const mapRecordToProperty = (record: any): Property => {
  try {
    console.log(`Mapping record ${record.id} to Property`);
    
    // Parse AI Instructions from JSON string
    let aiInstructions: AIInstruction[] = [];
    try {
      const aiInstructionsStr = record.get('AI Instructions');
      if (aiInstructionsStr) {
        aiInstructions = JSON.parse(aiInstructionsStr);
        console.log('Parsed AI Instructions:', aiInstructions);
      }
    } catch (error) {
      console.warn('Failed to parse AI Instructions:', error);
    }

    // Map the record to a Property object
    const property: Property = {
      id: record.id,
      name: record.get('Name') || '',
      address: record.get('Address') || '',
      description: record.get('Description') || '',
      photos: Array.isArray(record.get('Photos')) 
        ? record.get('Photos').map((photo: any) => photo.url)
        : [],
      aiInstructions,
      autoPilot: record.get('Auto Pilot') || false
    };

    console.log('Mapped property:', {
      id: property.id,
      name: property.name,
      aiInstructions: property.aiInstructions
    });

    return property;
  } catch (error) {
    console.error(`Error mapping record ${record.id} to Property:`, error);
    throw new Error('Failed to map Airtable record to Property');
  }
};