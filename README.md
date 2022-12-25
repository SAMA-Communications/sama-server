# SAMA - Simple but Advanced Messaging Alternative

## Overview

The intention of another messging protocol is to provide an alternative solution to the wide spread [XMPP](https://xmpp.org) messaging protocol (and to be honest - the only wide spread 'standard' these days). 

XMPP is huge. XMPP covers pretty much every possible use case. These 2 things at the same time is main advantage and disvantage of it. 

What we personally (and many other people) do not like about XMPP:

* Long connection & authentication flow, with a complexe session resumption management.
* Lots of noisy traffic when use Roster for contact list.
* Group chats is not a part of core protocol, hence there are many diffs in implementation when use private and group messaging.
* Group chats: join room requirement. 
* Complexe and limited recent chats list implementation based on top of MAM XEP which always leads to implementing an additional separated HTTP service.
* HTTP API is not a part of core protocol. HTTP API is much convenient for some operations like user signup, retrieve recent chats list, retrieve chat messages, block list, contact list etc.
* Lots of diff XEPs which makes hard for newcomers to pick the right direction what should be used.

With SAMA our goal is the following:
* to provide the minimal but enough features set for implementing standard chat app and cover 90% use cases
* super simple and clean API
* out of the box clustering support - spine as many servers as needed to support big MAU.

Disclaimer: the authors behind SAMA have 10+ years experience in building messaging apps and services based on top of XMPP protocol.

## Development

Make sure you have Node 18 installed.

- `docker-compose up` to run dependant services (S3, Minio)
- `npm install` and `npm run start` to run server

## API

### Transport

* WSS
* (TBA) TLS socket 
* (TBA) UDP channel 
* (TBA) QUIC

### Create user

```
{
  request: {
    user_create: {
      login: "user_1",
      password: "user_paswword_1",
    },
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c",
  },
};

{ 
  response: { 
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c", 
    user: {
      created_at: "2022-10-13T13:11:04.447Z",
      updated_at: "2022-10-13T13:11:04.447Z",
      login :"user_1",
      id: "63480e68f4794709f802a2fa", 
    } 
  }
}
```

### Login user

```
{
  request: {
    user_login: {
      login: "user_1",
      password: "user_paswword_1",
    },
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c",
  },
};

{ 
  response: { 
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c", 
    user: {
      created_at: "2022-10-13T13:11:04.447Z",
      updated_at: "2022-10-13T13:11:04.447Z",
      login :"user_1",
      id: "63480e68f4794709f802a2fa", 
    }, 
    token: "..." 
  }
}
```

Later, the subsequent logins can be done via `token`:

```
{
  request: {
    user_login: {
      token: "...",
    },
    id: "3",
  },
};

{ response: { id: "3", user: {...}, token: "..." }
```

### Logout user

```
{
  request: {
    user_logout: {},
    id: "3",
  },
};

{ response: { id: "3", success: true } }
```

### Update user

```
{
  request: {
    user_edit: {
      login: "user_1",
      current_password: "...",
      new_password: "..."
    },
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c",
  },
};

{ 
  response: { 
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c", 
    user: {
      created_at: "2022-10-13T13:11:04.447Z",
      updated_at: "2022-10-13T13:11:04.447Z",
      login :"user_1",
      id: "63480e68f4794709f802a2fa", 
    } 
  }
}
```

### User delete

```
{
  request: {
    user_delete: {
      id: "63077ad836b78c3d82af0866",
    },
    id: "3",
  },
};

{ response: { id: "3", success: true } }
```

### Users search

```
{
  request: {
    user_search: {
      login: "sam",
      limit: 100,
      updated_at: {
        gt: timestamp1,
      },
      ignore_ids: [45, 98]
    },
    id: "3",
  },
};

{ response: { id: "3", users: [...]}
```

### Conversation create 

```
{
  request: {
    conversation_create: {
      name: "ChantName",
      description: "Description",
      type: "g"
      participants: [ "63077ad836b78c3d82af0812", "63077ad836b78c3d82af0866" ],
    },
    id: "4",
   },
};

{ response: { id: "4", conversation: {...} } }
```

A `type` param must have only one of two values:
* `u` - (user) - a private conversations for two people only
* `g` - (group) - conversations for a group of users, two or more.

### Conversation update

```
{
  request: {
    conversation_update: {
      id: currentConversationId,
      name: "NewName",
      description: "NewDescription",
      participants: {
        add: [ "63077ad836b78c3d82af0812", "63077ad836b78c3d82af0832" ],
        remove: [ "63077ad836b78c3d82af0816" ],
      },
    },
    id: "5",
  },
};

{ response: { id: "5", conversation: {...} } }
```

### Conversation delete

```
{
  request: {
    conversation_delete: {
      id: "63077ad836b78c3d82af0812",
    },
    id: "4",
  },
};

{ response: { id: "4", success: true } }
```

### List conversations 

```
{
  request: {
    conversation_list: {
      limit: 67,
      updated_at: {
        gt: timestamp1,
      },
    },
    id: "7",
  },
};

{ 
  response: { 
    id: "7", 
    conversations: [ 
      {
        "_id": "507f1f77bcf86cd799439011",
        "created_at": "",
        "updated_at": "",
        "name": "General",
        "type": "g",
        "description": "General discuss chat",
        "owner_id": "507f191e810c19729de860ea",
        "opponent_id": "507f191e810c19729de880ee",
        "last_message": {
          "_id" :"507f191e810c19729de860ea", 
          "body": "Any news on the recent decision?", 
          "from": "507f191e810c19729de880ee", 
          "t": 15673838833,
        },
        "unread_messages_count": 2
      }
    ] 
  } 
}
```

### List conversations' participants

```
{
    "request": {
        "getParticipantsByCids": {
            "cids": [
                "635a3b4cb15254ebe43e76ff",
                "63563a2ad745dc1c6ad01b5f",
                "63563a0cd745dc1c6ad01b5c"
            ]
        },
        "id": "e3a1fcbf-bb1a-4c6d-b13a-8952db609585"
    }
}

{
    "response": {
        "id": "e3a1fcbf-bb1a-4c6d-b13a-8952db609585",
        "users": [
            {
                "_id": "634ec51c0b65918393dca5bf",
                "login": "carol18"
            },
            {
                "_id": "63480e68f4794709f802a2fa",
                "login": "breadpit"
            }
        ]
    }
}
```

### Send/Receive messages

```
{
  'message': {
    'body': 'hey how is going?',
    'cid': '63480e68f4794709f802a2fa',
    'x': {
      'param1': 'value',
      'param2': 'value'
    }
  }
}
```

All conversation's participants who is online will receive the following message in real-time:

```
{
  'message': {
    'id': '63480e68f4794709f802a2fa', 
    't': 15673838833,
    'from': '634ec51c0b65918393dca5bf',
    'body': 'hey how is going?',
    'cid': 'xcv',
    'x': {
      'param1': 'value',
      'param2': 'value'
    }
  }
}
```

All offline participants can retrieve the messages via below `List messages` API.


### Sent status

On each message sent to server - a server will deliver back to client a simple packet with message id and timestamp at which the message was stored in DB so both sender & recipient will have same date sent time stored:

`{'ack': {'mid': '63480e68f4794709f802a2fa', 't': 15673838833}}`

### List messages 

```
{
  request: {
    message_list: {
      cid: "63077ad836b78c3d82af0812",
      limit: 27,
      updated_at: {
        gt: timestamp1,
      },
    },
    id: "ef5326a5-b16b-4f75-9e88-cc42e5fea016",
  };
}

{ 
  response: { 
    id: 'ef5326a5-b16b-4f75-9e88-cc42e5fea016', 
    messages: [
      {
        "_id": "63760c34c35e750877677925",
        "body": "How is going?",
        "cid": "63563a2ad745dc1c6ad01b5f",
        "from": "63480e68f4794709f802a2fa",
        "status": "sent",
        "t": 1668680757,
      }
    ] 
  } 
}

```

### Read message status

```
{
  request: {
    message_read: {
      cid: "63077ad836b78c3d82af0812",
      ids: [63480e68f4794709f802a2fa, 63077ad836b78c3d82af0866],
    },
    id: "3",
  },
};

{ response: { id: "3", success: true } }
```

If `ids` is omit, we mark all unread messages as read.

Then, all the users whose messages we read will receive the following message:

```
{
  message_read: {
    cid: "63077ad836b78c3d82af0812"
    ids: ["63480e68f4794709f802a2fa", "63077ad836b78c3d82af0866"],
    from: "634ec51c0b65918393dca5bf"
  },
};
```

### Message typing

A user either can send typing or stop typing packets:

```
{
  'typing': {
    'id': 'xyz', 
    't': 15673838833,
    'type': 'start/stop',
    'cid': 'xcv'
  }
}
```

Then other users in this conversation who is online will receive the same typing message.

### Delete message

Delete multiple messages in conversation.

Can delete for current user or for all users in a conversation.

```
{
  request: {
    message_delete: {
      cid: "63077ad836b78c3d82af0812"
      ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
      type: "myself" | "all"
    },
    id: "4",
  },
};

{ response: { id: "4", success: true } }
```

If use "all", then other users in this conversation who is online will receive the following message:

```
{
  message_delete: {
    cid: "63077ad836b78c3d82af0812"
    ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
    type: "all",
    from: "634ec51c0b65918393dca5bf"
  },
};
```

If users are offline, they will receive a message once became online.

### Edit message

A message sender can edit own message.

```
{
  request: {
    message_edit: {
      id: "63077ad836b78c3d82af0812",
      body: 'updated message body'
    },
    id: "4",
  },
};

{ response: { id: "4", success: true } }
```

Then other users in this conversation who is online will receive the following message:

```
{
  message_edit: {
    id: "63077ad836b78c3d82af0812",
    body: 'updated message body'
    from: "634ec51c0b65918393dca5bf"
  },
};
```

If users are offline, they will receive a message once became online.

### Carbons

Carbons is enabled by default.  On send - a message will be delivered back to all active sender's devices except the current one.  

### Last activity

A user can request last activity of other users:

```
{
  request: {
    user_last_activity: {
      ids: [uid1, uid2, uid3],  // max 10 uids per request
    },
    id: "4",
  },
};

{
  response: {
   id: "4",
   last_activity: {
     uid1: num_of_seconds,
     uid2: "online",
     uid3: num_of_seconds,
   }
}
```

#### Last activity subscription

There is a way to subscribe to some user activity status upodate in real-time:

```
{
  request: {
    user_last_activity_subscribe: {
      id: uid1
    },
    id: "4",
  },
};

{
  response: {
   id: "4",
   last_activity: {
     uid1: "online" | <last_activity-time>,
   }
}
```

Once that user will go offline/online, you will be receiving his/her last activity status:

```
last_activity: {
  uid1:  "online" | num_of_seconds
}
```

### System messages

TBA

### Offline queue

TBA

### Attachments

Create file upload url:

```
{
  request: {
    create_files: [
      { name: "1.png", size: 240, content_type: "image/png" },
      { name: "2.jpeg", size: 760, content_type: "image/jpeg" },
    ],
    id: "4",
  },
};

{
  response: {
   id: "4",
   files: [
     {
       _id: "63077ad836b78c3d82af0812",
       name: "1.png",
       size: 240,
       content_type: "image/png",
       upload_url: "https://...."
     },
     {
       _id: "63077ad836b78c3d82af0813",
       name: "2.jpeg",
       size: 760,
       content_type: "image/jpeg",
       upload_url: "https://...."
     },
   ]
}
```

Get file download url:

```
{
  request: {
    get_file_urls: {
      file_ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
    }
    id: "5",
  },
};

{
  response: {
   id: "5",
   file_urls: [
     "https://....",
     "https://...."
   ]
}
```


### Block list

Block user:

```
{
  request: {
    block_user: {
      id: "63077ad836b78c3d82af0812"
    },
    id: "4",
  },
};

{
  response: {
   id: "4",
   success: true
}
```

Unblock user:

```
{
  request: {
    unblock_user: {
      id: "63077ad836b78c3d82af0812"
    },
    id: "5",
  },
};

{
  response: {
   id: "6",
   success: true
}
```

Get blocked users list:

```
{
  request: {
    list_blocked_users: {},
    id: "5",
  },
};

{
  response: {
   id: "5",
   users: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"]
}
```

### Contacts list

TBA

## IDC - inter deployments communication

TBA

## API (todo)

* [x] User create
* [x] User login
* [x] User logout
* [x] User delete
* [x] User edit
* [x] Search users
* [x] Create conversation
* [x] List conversations
* [x] Edit conversation
* [x] Delete conversation
* [x] Get conversation's participants
* [x] Send/Receive message
* [x] List chat messages
* [x] Typing status
* [x] Read status
* [x] Last activity / Last activity subscription
* [x] Attachments (create upload url, get download url)
* [x] Block user / Unblock user / List blocked users
* [] Address book
* [] Push notifications 
