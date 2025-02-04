#!/bin/bash

curl -i -X POST \
  "https://graph.facebook.com/v21.0/477925252079395/messages" \
  -H 'Authorization: Bearer EAAX0gXt8e64BO...' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual", 
    "to": "33617370484",
    "type": "template",
    "template": {
        "name": "hello_world",
        "language": {
            "code": "en_US"
        }
    }
}'
