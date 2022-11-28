# SAMA - Simple but Advanced Messaging Alternative

## Overview
The intention of another messging protocol is to provide an alternative solution to the wide spread XMPP messaging protocol (and to be honest - the only one wide spread 'standard' these days). 

XMPP is huge. XMPP covers pretty much every possible use case. These 2 things at the same time is main advantage and disvantage of it. 

Disclaimer: the origin author has 10+ years experience in building messaging apps and services based on top of XMPP. 

What personally I (and many other people) do not like about XMPP:

* Long connection & authentication flow, with a complexe session resumption management.
* Lots of noisy traffic when use Roster
* Group chats is not a part of core protocol, hence there are many diffs in implementation when use private and group messaging.
* Group chats: join room requirement. 
* Complexe and limited recent chats list implementation based on top of MAM XEP which always leads to implementing an additional separated HTTP service.
* HTTP API is not a part of core protocol.  HTTP API is much convenient for some operations like user signup, retrieve recent chats list, retrieve chat messages, block list, contact list etc.
* Lots of diff XEPs which makes hard for newcomers to pick the right direction what should be used.

With SAMA our goal is the following:
* to provide the minimal but enough features set for implementing standard chat app and cover 90% use cases
* as much as possible simple API
* clustering support out of the box - to cover cases with big MAU easily from day 1.

## Transport

* WSS
* (TBA) TLS socket 

## Authentication

Login + pwd 

## API

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
```

```
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
    'id': 'xyz', 
    't': 15673838833,
    'to': '',
    'from': '',
    'body': 'hey how is going?',
    'cid': 'xcv',
    'x': {
      'param1': 'value',
      'param2': 'value'
    }
  }
}
```

A `t` param should be omit at sender's side. Server will add it by itself in a message to recipient. 
To make sure both sender and recipient have same message timestamp - see belowe about `Sent status`


### Sent status

On each message sent to server - a server will deliver back to client a simple packet with message id and timestamp at which the message was stored in DB so both sender & recipient will have same date sent time stored:

`{'ack': {'mid': 'xyz', 't': 15673838833}}`

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
      cid: "..",
      ids: [1, 2, 3],
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
    ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
    from: "..."
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
    'to': '',
    'from': '',
    'cid': 'xcv'
  }
}
```

Either `cid` or `to` should be provided. 

A `t` param should be omit at sender's side. Server will add it by itself in a message to recipient. 

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
    from: "..."
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
    from: "..."
  },
};
```

If users are offline, they will receive a message once became online.

### Carbons

Carbons is enabled by default.  On send - a message will be delivered back to all active sender's devices except the current one.  


### System messages

```
{
  'system_message': {
    'id': 'xyz', 
    't': 15673838833,
    'to': '',
    'from': '',
    'x': {
      'param1': 'value',
      'param2': 'value'
    }
  }
}
```

A system message is a message w/o body, but with a set of params. The intention to have system mesasges is to exchange non human content.
These mesasge will never be saved into history.

## Offline queue

TBA

## Contacts list

* Upload complete address book
* CRUD on contacts

TBA

## Last activity

### Request 

TBA

```
{
  'last_activity': {
    'to': '',
  }
}
```

### Response 

```
{
  'last_activity': {
    'from': '',
    'last_activity_ago': 'num_of_seconds'
  }
}
```

## Attachments

Upload attachments to server and send a fid to opponents, so they will build an url and download it. 

## Block list

Can block, unblock and list blocked users. 

TBA

## IDC - inter deployments communication

Will support it on a later stage

## API (todo)

* [x] User create
* [x] User login
* [x] User logout
* [x] User delete
* User edit
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
* Upload attachment
* Get attachment by url
* Last activity
* Block user
* Unblock user
* List blocked users
* Upload complete/changes address book
* Subscribe to push notifications 
