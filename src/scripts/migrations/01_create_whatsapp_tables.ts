import { base } from '../../services/airtable/config';

async function createWhatsAppTables() {
  if (!base) {
    console.error('Airtable configuration is invalid');
    return;
  }

  try {
    // 1. Étendre la table Users
    console.log('Extending Users table...');
    const usersTable = base('Users');
    // Note: Cette partie est manuelle car Airtable ne permet pas de modifier
    // la structure des tables via l'API. Instructions à suivre manuellement.
    console.log(`
    Pour étendre la table Users, ajoutez manuellement les champs suivants :
    - whatsapp_config (JSON):
      {
        phone_number: string,
        waba_id: string,
        api_key: string
      }
    - status (Single select): ['active', 'pending', 'suspended']
    `);

    // 2. Créer la table WhatsAppConfig
    console.log('Creating WhatsAppConfig table...');
    const whatsappConfigTable = base('WhatsAppConfig');
    await whatsappConfigTable.create([
      {
        fields: {
          user_id: '', // Example user_id
          phone_number: '', // Example phone number
          waba_id: '', // Example WABA ID
          webhook_url: '', // Example webhook URL
          api_key: '', // Example API key
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'pending',
          settings: JSON.stringify({
            notification_email: '',
            auto_reply: false,
            business_hours: []
          })
        }
      }
    ]);

    // 3. Créer la table WhatsAppMessages
    console.log('Creating WhatsAppMessages table...');
    const whatsappMessagesTable = base('WhatsAppMessages');
    await whatsappMessagesTable.create([
      {
        fields: {
          user_id: '', // Example user_id
          conversation_id: '', // Example conversation_id
          wa_message_id: '', // Example WhatsApp message ID
          direction: 'inbound',
          status: 'delivered',
          content: JSON.stringify({
            type: 'text',
            text: 'Example message',
            media_url: '',
            metadata: {}
          }),
          timestamp: new Date().toISOString(),
          retry_count: 0,
          error: ''
        }
      }
    ]);

    console.log(`
    Migration completed successfully!
    
    Next steps:
    1. Verify the tables in Airtable
    2. Add appropriate indexes:
       - WhatsAppMessages: user_id + timestamp
       - WhatsAppMessages: wa_message_id
       - WhatsAppMessages: conversation_id + timestamp
       - WhatsAppConfig: phone_number (unique)
       - WhatsAppConfig: user_id
    3. Set up appropriate permissions
    4. Add any additional fields if needed
    `);

  } catch (error) {
    console.error('Error during migration:', error);
    if (error.error === 'NOT_FOUND') {
      console.log(`
      Error: Tables not found. Please create the following tables manually in Airtable:
      
      1. WhatsAppConfig:
         - user_id (Single line text)
         - phone_number (Single line text)
         - waba_id (Single line text)
         - webhook_url (Single line text)
         - api_key (Single line text)
         - created_at (Date)
         - updated_at (Date)
         - status (Single select): ['active', 'pending', 'suspended']
         - settings (JSON)

      2. WhatsAppMessages:
         - user_id (Single line text)
         - conversation_id (Single line text)
         - wa_message_id (Single line text)
         - direction (Single select): ['inbound', 'outbound']
         - status (Single select): ['sent', 'delivered', 'read', 'failed']
         - content (JSON)
         - timestamp (Date)
         - retry_count (Number)
         - error (Long text)
      `);
    }
    throw error;
  }
}

// Exécuter la migration
createWhatsAppTables()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
