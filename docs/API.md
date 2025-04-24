# API

## Transport

- WSS

## Users API

### Create

```
{
  request: {
    user_create: {
      organization_id: "680a2fae96cc69d78861f101",
      login: "user_1",
      password: "user_paswword_1"
    },
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c"
  }
}

{
  response: {
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c",
    user: {
      _id: "63480e68f4794709f802a2fa",
      login :"user_1",
      created_at: "2022-10-13T13:11:04.447Z",
      updated_at: "2022-10-13T13:11:04.447Z"
    }
  }
}
```

### Login

**WARNING**: `user_login` request is deprecated

_! Therefore, we recommend using the new http route `/login` for user authorization. !_

Http request examples:

- `POST /login` Possible variations of request parameters:

```
{
  organizationId: "680a2fae96cc69d78861f101",
  login: "login_u1",
  password: "u1_password",
  device_id: "device_u1"
}
```

When you use `access_token` for authorization:

```
{
  device_id: "device_u1"
}
```

- `access_token` must be put in the request header.

If the authorization was performed using `login & password` or `refresh_token`, a new `refresh_token` will be **embedded in the response cookie**.

All variations of the query will have the same response:

```
{
  user: {
      _id: "63480e68f4794709f802a2fa",
      login :"login_u1",
      created_at: "2022-10-13T13:11:04.447Z",
      updated_at: "2022-10-13T13:11:04.447Z"
    },
  access_token: "...",
  expired_at: timestamp_in_ms
}
```

`expired_at` - the time when the `access_token` will expire

After receiving the `access_token`, the client must send a request to connect the socket to the server and link it to the current access_token:

```
{
  request: {
    connect: {
      token: "access_token",
      device_id: "device_u1"
    },
    id: "connect_request"
  }
}

{ response: { id: "connect_request", success: true } }
```

Old websocket requests examples:

```
{
  request: {
    user_login: {
      organization_id: "680a2fae96cc69d78861f101",
      login: "user_1",
      password: "user_paswword_1",
      device_id: "xxx-yyy-zzz"
    },
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c"
  }
}

{
  response: {
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c",
    user: {
      _id: "63480e68f4794709f802a2fa",
      created_at: "2022-10-13T13:11:04.447Z",
      updated_at: "2022-10-13T13:11:04.447Z",
      login :"user_1"
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
      token: "..."
    },
    id: "3"
  }
}

{ response: { id: "3", user: {...}, token: "..." } }
```

### Logout

**WARNING**: `user_logout` request is deprecated

_! Therefore, we recommend using the new http route `/logout` to log the user out of the system. !_

Http request example:

- `POST /logout` Request parameters:

The `body` of the request can be empty, but you need to put the `access_token` in the request header, for example:

```
{
  ...
  headers: {
    Authorization: `Bearer ${accessToken}`,
    ...
  }
}
```

Response:

```
{ success: true }
```

Please note that if you do not pass an actual `refresh_token` in the http request credentials, then use hard session cleanup using a web socket request.

Old websocket requests examples:

```
{
  request: {
    user_logout: {},
    id: "3"
  }
}

{ response: { id: "3", success: true } }
```

### Update / edit

```
{
  request: {
    user_edit: {
      current_password: "...",
      new_password: "...",
      email: "...",
      phone: "..."
    },
    id: "421cda83-7f39-45a9-81e8-5f83cfa0733c"
  }
}

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

### Delete

```
{
  request: {
    user_delete: {},
    id: "3"
  }
}

{ response: { id: "3", success: true } }
```

### Search

```
{
  request: {
    user_search: {
      keyword: "sam",
      limit: 100,
      updated_at: {
        gt: timestamp_in_ms,
      },
      ignore_ids: [ "63077ad836b78c3d82af0866", "63077ad836b78c3d82af0868" ]
    },
    id: "3"
  }
}

{ response: { id: "3", users: [...]} }
```

### List by ids

```
{
  get_users_by_ids: {
    ids: [ "65fcb3f67dbaace5021595b9" ]
  },
  id: "4"
}

{ response: { id: "4", users: [...]} }
```

## Address book (Contact) API

### Add

```
{
  request: {
    contact_add: {
      first_name: "Name",
      last_name: "Surname",
      company: "UserCompany",
      email: [
        { type: "work", value: "..." },
        { type: "home", value: "..." },
        ...
        ],
      phone: [
        { type: "work", value: "..." },
        { type: "home", value: "..." },
        ...
        ]
    },
    id: "4"
   }
}

{
  response: {
    id: "4",
    contact: {
      _id: "63480e68f4794709f802a2fa",
      first_name: "Name",
      last_name: "Surname",
      company: "UserCompany",
      email: [
        { type: "work", value: "...", matched_user_id: "uId5" },
        { type: "home", value: "..." },
        ...
        ],
      phone: [
        { type: "work", value: "..." },
        { type: "home", value: "...", matched_user_id: "uId7" },
        ...
        ],
      updated_at: "",
      created_at: ""
    }
  }
}
```

`email` or `phone` param is required, as well as `first_name` or `last_name`.

### Batch add

```
{
  request: {
    contacts: [
      {
        first_name: "Name",
        last_name: "Surname",
        company: "UserCompany",
        email: [ { type: "work", value: "..." } ],
        phone: [ { type: "home", value: "..." } ]
      },
      {
        first_name: "Name2",
        last_name: "Surname2",
        company: "UserCompany2",
        email: [ { type: "work", value: "..." } ],
        phone: [ { type: "home", value: "..." } ]
      },
      ...
    ]
    id: "5"
   }
}

{
  response: {
    id: "5",
    contacts: [
      {
        _id: "63480e68f4794709f802a2fa",
        first_name: "Name",
        last_name: "Surname",
        company: "UserCompany",
        email: [ { type: "home", value: "..." } ],
        phone: [ { type: "home", value: "...",  matched_user_id: "uId7" } ],
        updated_at: "",
        created_at: ""
      },
      {
        _id: "63480e68f4794709f802a2fy",
        first_name: "Name2",
        last_name: "Surname2",
        company: "UserCompany2",
        email: [ { type: "home", value: "..." } ],
        phone: [ { type: "home", value: "...",  matched_user_id: "uId6" } ],
        updated_at: "",
        created_at: ""
      }
    ]
  }
}
```

### Update

```
{
  request: {
    contact_update: {
      id: "63480e68f4794709f802a2fa",
      first_name: "Name",
      last_name: "Surname",
      company: "UserCompany",
      email: [
        { type: "work", value: "..." },
        { type: "home", value: "..." },
        ...
        ],
      phone: [
        { type: "work", value: "..." },
        { type: "home", value: "..." },
        ...
        ]
    },
    id: "14"
   }
}

{
  response: {
    id: "14",
    contact: {
      _id: "63480e68f4794709f802a2fa",
      first_name: "Name",
      last_name: "Surname",
      company: "UserCompany",
      email: [
        { type: "work", value: "...", matched_user_id: "uId5" },
        { type: "home", value: "..." },
        ...
        ],
      phone: [
        { type: "work", value: "..." },
        { type: "home", value: "...", matched_user_id: "uId7" },
        ...
        ],
      updated_at: "",
      created_at: ""
    }
  }
}
```

### List

```
{
  request: {
    contact_list: {
      updated_at: "",
      limit: 56,
    },
    id: "54",
   },
};

You can also add the `ids` parameter if you need to get the target chat objects. The maximum number of ids in a request is 10.
For example: ["63480e68f4794709f802a2fa", "63480e68f4794709f802a2fy"]


{
  response: {
    id: "54",
    contacts: [
      {
        _id: "63480e68f4794709f802a2fa",
        first_name: "Name",
        last_name: "Surname",
        company: "UserCompany",
        email: [ { type: "home", value: "..." } ],
        phone: [ { type: "home", value: "...",  matched_user_id: "uId7" } ],
        updated_at: "",
        created_at: ""
      },
      {
        _id: "63480e68f4794709f802a2fy",
        first_name: "Name2",
        last_name: "Surname2",
        company: "UserCompany2",
        email: [ { type: "home", value: "..." } ],
        phone: [ { type: "home", value: "...",  matched_user_id: "uId6" } ],
        updated_at: "",
        created_at: ""
      }
    ]
  }
}
```

### Delete

```
{
  request: {
    contact_delete: {
      id: "63480e68f4794709f802a2fa"
    },
    id: "14"
   }
}

{ response: { id: "14", success: true } }
```

A `id` param is required.

## Conversations API

### Create

```
{
  request: {
    conversation_create: {
      name: "ChantName",
      description: "Description",
      type: "g"
      participants: [ "63077ad836b78c3d82af0812", "63077ad836b78c3d82af0866" ]
    },
    id: "4"
   }
}

{ response: { id: "4", conversation: {...} } }
```

A `type` param must have only one of two values:

- `u` - (user) - a private conversations for two people only
- `g` - (group) - conversations for a group of users, two or more.

After conversation created, all the online participants will receive the following event about newly created conversation:

```
{
  system_message: {
    _id: "646e2092d80fe5c4e688dfa0",
    t: 15673838833,
    cid: "646e2092d80fe5c4e688dfa0",
    from: "63077ad836b78c3d82af0812",
    x: {
      conversation_created: {
        _id: "646e2092d80fe5c4e688dfa0",
        type: "u",
        opponent_id: "646c823bf989c57fe910d289",
        participants: [ "646c823bf989c57fe910d289" ],
        owner_id: "646c82947b3aceab988c0073",
        created_at: "2023-05-24T14:34:58.066Z",
        updated_at: "2023-05-24T14:52:24.953Z"
      }
    }
  }
}
```

### Update / edit

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
      }
    },
    id: "5"
  }
}

{ response: { id: "5", conversation: {...} } }
```

After adding users to a conversation, if they are online, they will receive the following event about the newly created conversation:

```
{
  system_message: {
    _id: "646e2092d80fe5c4e688dfa0",
    t: 15673838833,
    cid: "646e2092d80fe5c4e688dfa0",
    from: "63077ad836b78c3d82af0812",
    x: {
      conversation_updated: {
        _id: "646e2092d80fe5c4e688dfa0",
        type: "u",
        opponent_id: "646c823bf989c57fe910d289",
        participants: [ "646c823bf989c57fe910d289" ],
        owner_id: "646c82947b3aceab988c0073",
        created_at: "2023-05-24T14:34:58.066Z",
        updated_at: "2023-05-24T14:52:24.953Z"
      }
    }
  }
}
```

The following message will also be sent to all users who are online and saved in the `Message` collection:

```

{
\_id: "655b479fe980b3e36f402234",
body: "Ivan Ivanovich has been added to the group",
cid: "646e2092d80fe5c4e688dfa0",
from: "646c82947b3aceab988c0073",
status: "sent"
t: 1700480927,
x: {
type: "added_participant",
user: {
\_id: "64cb6b2def440b9c5bf18d6d",
login: "ivan1991",
recent_activity: 1700149064,
first_name: "Ivan",
last_name: "Ivanovich",
email: "DonateforUkraine@gmail.com"
}
},
created_at: "2023-05-24T14:34:58.066Z"
}

```

After kicking users out of the conversation, if they are online, they will receive the following event:

```
{
  system_message: {
    _id: "646e2092d80fe5c4e688dfa0",
    t: 15673838833,
    cid: "646e2092d80fe5c4e688dfa0",
    from: "63077ad836b78c3d82af0812",
    x: {
      conversation_kicked: {
        _id: "646e2092d80fe5c4e688dfa0",
        type: "u",
        opponent_id: "646c823bf989c57fe910d289",
        participants: [ "646c823bf989c57fe910d289" ],
        owner_id: "646c82947b3aceab988c0073",
        created_at: "2023-05-24T14:34:58.066Z",
        updated_at: "2023-05-24T14:52:24.953Z"
      }
    }
  }
}
```

The following message will also be sent to all users who are online and saved in the `Message` collection:

```
{
  _id: "655b479fe980b3e36f402234",
  body: "Ivan Ivanovich has been added to the group",
  cid: "646e2092d80fe5c4e688dfa0",
  from: "646c82947b3aceab988c0073",
  status: "sent"
  t: 1700480927,
  x: {
    type: "added_participant",
    user: {
      _id: "64cb6b2def440b9c5bf18d6d",
      login: "ivan1991",
      recent_activity: 1700149064,
      first_name: "Ivan",
      last_name: "Ivanovich",
      email: "DonateforUkraine@gmail.com"
    }
  },
  created_at: "2023-05-24T14:34:58.066Z"
}
```

The following message will also be sent to all users who are online and saved in the `Message` collection:

```
{
  _id: "655b479fe980b3e36f402234",
  body: "Lane Stark has been remove from the group",
  cid: "646e2092d80fe5c4e688dfa0",
  from: "646c82947b3aceab988c0073",
  status: "sent"
  t: 1700480927,
  x: {
    type: "removed_participant",
    user: {
      _id: "64cb6b2def440b9c5bf18d6d",
      login: "lane1991",
      recent_activity: 1700149064,
      first_name: "Lane",
      last_name: "Stark",
      email: "DonateforUkraine@gmail.com"
    }
  },
  created_at: "2023-05-24T14:34:58.066Z"
}
```

### Delete

```
{
  request: {
    conversation_delete: {
      id: "63077ad836b78c3d82af0812"
    },
    id: "4"
  }
}

{ response: { id: "4", success: true } }
```

When a user leaves the group chat, the next message will also be sent to all users who are online and saved in the `Messages` collection:

```
{
  _id: "6666c4bb2429c50ad0eb0ff6",
  cid: "665ee4ab01f6a3b5ec90a2f4",
  body: "lane1991 has left the group",
  t: 1718011067,
  from: "65fcb3f67dbaace5021595b9",
  x: {
    type: "left_participants",
    user: {
      native_id: "646e2092d80fe5c4e688dfa0",
      _id: "646e2092d80fe5c4e688dfa0",
      login: "lane1991",
      recent_activity: 1717670392,
      created_at: "2024-03-21T22:25:58.169Z",
      updated_at: "2024-03-21T22:25:58.169Z"
    }
  },
  created_at: "2023-05-24T14:34:58.066Z"
}
```

### List

```
{
  request: {
    conversation_list: {
      limit: 67,
      updated_at: {
        gt: timestamp_in_ms
      }
    },
    id: "7"
  }
}

{
  response: {
    id: "7",
    conversations: [
      {
        _id: "507f1f77bcf86cd799439011",
        created_at: "",
        updated_at: "",
        name: "General",
        type: "g",
        description: "General discuss chat",
        owner_id: "507f191e810c19729de860ea",
        opponent_id: "507f191e810c19729de880ee",
        last_message: {
          _id :"507f191e810c19729de860ea",
          body: "Any news on the recent decision?",
          from: "507f191e810c19729de880ee",
          t: 15673838833
        },
        unread_messages_count: 2
      }
    ]
  }
}
```

### List conversations' participants

```
{
  request: {
    get_participants_by_cids: {
      cids: [
        "635a3b4cb15254ebe43e76ff",
        "63563a2ad745dc1c6ad01b5f",
        "63563a0cd745dc1c6ad01b5c"
      ]
    },
    id: "e3a1fcbf-bb1a-4c6d-b13a-8952db609585"
  }
}

{
  response: {
    id: "e3a1fcbf-bb1a-4c6d-b13a-8952db609585",
    users: [
      {
        _id: "634ec51c0b65918393dca5bf",
        login: "carol18"
      },
      {
        _id: "63480e68f4794709f802a2fa",
        login: "breadpit"
      },
      ...
    ],
    conversations: {
       635a3b4cb15254ebe43e76ff: [634ec51c0b65918393dca5bf, 63480e68f4794709f802a2fa],
       63563a2ad745dc1c6ad01b5f: [63480e68f4794709f802a2fa, 507f191e810c19729de860ea, 507f191e810c19729de880ee],
       ...
    }
  }
}
```

### Search

```
{
  request: {
    conversation_search: {
      name: "conversationName",
      limit: 100,
      updated_at: {
        gt: timestamp_in_ms,
      },
    },
    id: "8"
  }
}

{
  response: {
    id: "8",
    conversations: [
      {
        _id: "507f1f77bcf86cd799439011",
        name: "conversationNameTest",
      },
      {
        _id: "507f1f77bcf86cd799439012",
        name: "conversationNamePress",
      },
      ...
    ]
  }
}
```

## Messages API

### Send/Receive messages

```
{
  message: {
    id: "5а34p21m0xj23",
    body: "hey how is going?",
    cid: "63480e68f4794709f802a2fa",
    x: {
      param1: "value",
      param2: "value"
    },
    attachments: [
      { name: "file_1", size: 240, content_type: "type" },
      { name: "file_2", size: 126, content_type: "type" }
    ]
  }
}
```

All conversation's participants who is online will receive the following message in real-time:

```
{
  message: {
    _id: "63480e68f4794709f802a2fa",
    t: 15673838833,
    from: "634ec51c0b65918393dca5bf",
    body: "hey how is going?",
    cid: "63480e68f4794709f802a2fa",
    x: {
      param1: "value",
      param2: "value"
    },
    attachments: [
      { file_id: "123123_file_1", file_name: "file_1" },
      { file_id: "653534_file_2", file_name: "file_2" }
    ],
    created_at: "2023-07-04T07:23:53.308Z",
  }
}
```

Additionally, all conversation's participants who is offline will receive the following push notification:

```
{
  title: "UserName"
  body: "MessageText",
  firstAttachmentUrl: "url",
  cid: "63480e68f4794709f802a2fa"
}
```

All offline participants can retrieve the messages via below `List messages` API.

### Send/Receive system messages

```
{
  system_message: {
    id: "5а34p21m0xj23",
    uids: ["63480e68f4794709f802a2fc", "63480e68f4794709f802a2fb"],
    x: {
      param1: "value",
      param2: "value"
    },
  }
}
```

'uids' should contain recipients user id, who is online will receive the following message in real-time:

```
{
  system_message: {
    _id: "5а34p21m0xj23",
    t: 15673838833,
    from: "634ec51c0b65918393dca5bf",
    x: {
      param1: "value",
      param2: "value"
    },
  }
}
```

with 'cid'

```
{
  system_message: {
    id: "5а34p21m0xj24",
    cid: "63077ad836b78c3d82af0812",
    x: {
      param1: "value",
      param2: "value"
    },
  }
}
```

All conversation's participants who is online will receive the following message in real-time:

```
{
  system_message: {
    _id: "5а34p21m0xj24",
    t: 15673838833,
    cid: "63077ad836b78c3d82af0812"
    from: "634ec51c0b65918393dca5bf",
    x: {
      param1: "value",
      param2: "value"
    },
  }
}
```

### Sent status

On each message sent to server - a server will deliver back to client a simple packet with message id and timestamp at which the message was stored in DB so both sender & recipient will have same date sent time stored:

`{ ack: { mid: "63480e68f4794709f802a2fa", server_mid: "63480e68f4794709f802a2fa", t: 15673838833}}`

### List

```
{
  request: {
    message_list: {
      cid: "63077ad836b78c3d82af0812",
      limit: 27,
      updated_at: {
        gt: timestamp_in_ms
      }
    },
    id: "ef5326a5-b16b-4f75-9e88-cc42e5fea016"
  }
}

{
  response: {
    id: "ef5326a5-b16b-4f75-9e88-cc42e5fea016",
    messages: [
      {
        _id: "63760c34c35e750877677925",
        body: "How is going?",
        cid: "63563a2ad745dc1c6ad01b5f",
        from: "63480e68f4794709f802a2fa",
        status: "sent",
        attachments: [
          { file_id: "file_name_1", file_name: "file_1" }
        ],
        t: 1668680757,
        created_at: "2023-05-24T14:34:58.066Z"
      }
    ]
  }
}

```

### Read status

```
{
  request: {
    message_read: {
      cid: "63077ad836b78c3d82af0812",
      ids: [63480e68f4794709f802a2fa, 63077ad836b78c3d82af0866]
    },
    id: "3"
  }
}

{ response: { id: "3", success: true } }
```

If `ids` is omit, we mark all unread messages as read.

Then, all the users whose messages we read will receive the following message:

```
{
  message_read: {
    cid: "63077ad836b78c3d82af0812",
    ids: ["63480e68f4794709f802a2fa", "63077ad836b78c3d82af0866"],
    from: "634ec51c0b65918393dca5bf"
  }
}
```

### Typing status

A user either can send typing or stop typing packets:

```
{
  typing: {
    cid: "xcv"
  }
}
```

Then other users in this conversation who is online will receive the same typing message.

### Delete

Delete multiple messages in conversation.

Can delete for current user or for all users in a conversation.

```
{
  request: {
    message_delete: {
      cid: "63077ad836b78c3d82af0812",
      ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
      type: "myself" | "all"
    },
    id: "4"
  }
}

{ response: { id: "4", success: true } }
```

If use "all", then other users in this conversation who is online will receive the following message:

```
{
  message_delete: {
    cid: "63077ad836b78c3d82af0812",
    ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
    type: "all",
    from: "634ec51c0b65918393dca5bf"
  }
}
```

If users are offline, they will receive a message once became online.

### Update / edit

A message sender can edit own message.

```
{
  request: {
    message_edit: {
      id: "63077ad836b78c3d82af0812",
      body: "updated message body"
    },
    id: "4"
  }
}

{ response: { id: "4", success: true } }
```

Then other users in this conversation who is online will receive the following message:

```
{
  message_edit: {
    id: "63077ad836b78c3d82af0812",
    body: "updated message body",
    from: "634ec51c0b65918393dca5bf"
  }
}
```

If users are offline, they will receive a message once became online.

## Push Subscription API

### Create

```
{
  request: {
    push_subscription_create: {
      platform: "web",
      web_endpoint: 'enpoint',
      web_key_auth: 'auth',
      web_key_p256dh: 'p256dh',
      device_token: "..."
      device_udid: "deviceId"
    },
    id: "1",
  },
};

The [`web_endpoint`, `web_key_auth`, `web_key_p256dh`] and `device_token` fields are interchangeable for different devices

{
  response: {
    id: "1",
    subscription: {
      _id: "644156fea451b5950d13d0e8",
      platform: 'web',
      web_endpoint: 'enpoint',
      web_key_auth: 'auth',
      web_key_p256dh: 'p256dh',
      device_udid: 'deviceId',
      user_id: "644156fea451b5950d13d0e5",
      created_at: "",
      updated_at: ""
    }
  }
}
```

### List

```
{
  request: {
    push_subscription_list: {
      user_id: "644157e316eec28e3dfb8b31"
    },
    id: "1"
  }
}

{
  response: {
    id: 1,
    subscriptions: [
      {
        _id: "644157e316eec28e3dfb8b34",
        platform: 'web',
        web_endpoint: 'enpoint1',
        web_key_auth: 'auth1',
        web_key_p256dh: 'p256dh1',
        device_udid: 'deviceId1',
        user_id: "644157e316eec28e3dfb8b31",
        created_at: "",
        updated_at: ""
      },
      {
        _id: "644157e316eec28e3dfb8b35",
        platform: 'ios',
        web_endpoint: 'enpoint2',
        web_key_auth: 'auth2',
        web_key_p256dh: 'p256dh2',
        device_udid: 'deviceId2',
        user_id: "644157e316eec28e3dfb8b31",
        created_at: "",
        updated_at: ""
      }
    ]
  }
}

```

### Delete

```
{
  request: {
    push_subscription_delete: {
      device_udid: "deviceId"
    },
    id: "1"
  }
}

{ response: { id: 1, success: true } }
```

### Create Push Event

```
{
  request: {
    push_event_create: {
      recipients_ids: ["644157e316eec28e3dfb8b31", "644157e316eec28e3dfb8b32"],
      message: {
        title: "Title",
        body: "Message body"
      }
    },
    id: 1
  }
}

{
  response: {
    id: 1,
    event: {
      _id: "64415891066758fe6754f477",
      user_id: '64415890066758fe6754f472',
      recipients_ids: ["644157e316eec28e3dfb8b31", "644157e316eec28e3dfb8b32"],
      message: '{"title":"Title","body":"Message body"}',
      created_at: "",
      updated_at: ""
    }
  }
}
```

## Carbons

Carbons is enabled by default. On send - a message will be delivered back to all active sender's devices except the current one.

## Last activity API

### Last activity by ids

A user can request last activity of other users:

```
{
  request: {
    user_last_activity: {
      ids: [uid1, uid2, uid3]  // max 10 uids per request
    },
    id: "4"
  }
}

{
  response: {
    id: "4",
    last_activity: {
      uid1: num_of_seconds,
      uid2: "online",
      uid3: num_of_seconds
    }
  }
}
```

### Last activity subscription

There is a way to subscribe to some user activity status upodate in real-time:

```
{
  request: {
    user_last_activity_subscribe: {
      id: uid1
    },
    id: "4"
  }
}

{
  response: {
    id: "4",
    last_activity: {
      uid1: "online" | <last_activity-time>
    }
  }
}
```

Once that user will go offline/online, you will be receiving his/her last activity status:

```
last_activity: {
  uid1:  "online" | num_of_seconds
}
```

## System messages

TBA

## Operations log

```
{
 request: {
  op_log_list: {
    created_at: {
       gt: timestamp_in_ms
    },
  },
  id: "453"
 }
}
```

```
{
 response: {
  logs: [
    {
      _id: 325,
      user_id: 634ec51c0b65918393dca5bf,
      packet: { ... }
    },
    {
      _id: 5432,
      user_id: 634ec51c0b65918393dca5bf,
      packet: { ... }
    }
  ],
  id: "453"
 }
}
```

`gt` or `lt`param is required

## Attachments API

### Create file upload url

```
{
  request: {
    create_files: [
      { name: "1.png", size: 240, content_type: "image/png" },
      { name: "2.jpeg", size: 760, content_type: "image/jpeg" }
    ],
    id: "4"
  }
}

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
      }
    ]
  }
}
```

### Get file download url

```
{
  request: {
    get_file_urls: {
      file_ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"]
    },
    id: "5"
  }
}

{
  response: {
    id: "5",
    file_urls: [
      "https://....",
      "https://...."
    ]
  }
}
```

## Block users API

### Block

```
{
  request: {
    block_user: {
      ids: ["63077ad836b78c3d82af0812"]
    },
    id: "4"
  }
}

{
  response: {
    id: "4",
    success: true
  }
}
```

### Unblock

```
{
  request: {
    unblock_user: {
      ids: ["63077ad836b78c3d82af0812"]
    },
    id: "5"
  }
}

{
  response: {
    id: "6",
    success: true
  }
}
```

### List

```
{
  request: {
    list_blocked_users: {},
    id: "5"
  }
}

{
  response: {
    id: "5",
    users: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"]
  }
}
```

## PubSub

TBA

## Admin API

TBA

## Admin Http API

### 📌 `POST /admin/message`

**Description**:  
Sends a message to a specific conversation. The message can include text, attachments, and optional metadata. All online participants of the conversation will receive the message in real-time.

---

#### 🔐 Authorization
- Required Header:  
  `Admin-Api-Key: {{HTTP_ADMIN_API_KEY}}`

---

#### 📥 Request

**Content-Type**: `application/json`

```json
{
  "organizationId": "680a2fae96cc69d78861f101",
  "senderId": "63480e68f4794709f802a2fa",
  "message": {
    "id": "5а34p21m0xj23",
    "body": "hey how is going?",
    "cid": "63480e68f4794709f802a2fa",
    "x": {
      "param1": "value",
      "param2": "value"
    },
    "attachments": [
      { "name": "file_1", "size": 240, "content_type": "type" },
      { "name": "file_2", "size": 126, "content_type": "type" }
    ]
  }
}
```

---

#### 🧾 Request Parameters

| Field                    | Type              | Description                                                                 |
|--------------------------|-------------------|-----------------------------------------------------------------------------|
| `organizationId`         | `string`          | **OrganizationId** performing request                                       |
| `senderId`               | `string`          | **User ID** of the sender                                                   |
| `message.id`             | `string`          | Unique **message ID received from the server** (i.e., `server_mid` from a previous response), used for tracking and acknowledgment  |
| `message.body`           | `string`          | The message text                                                            |
| `message.cid`            | `string`          | **Conversation ID** the message belongs to                                  |
| `message.x`              | `object`          | Custom parameters, e.g. `{ "new_friend_connected": true }`                  |
| `message.attachments`    | `array` of `object`| Array of attachment metadata                                               |

---

#### ✅ Successful Response

```json
{
  "ask": {
    "mid": "5а34p21m0xj23",
    "server_mid": "63480e68f4794709f802a2fd",
    "t": 15673838834
  }
}
```

---

#### 📡 Real-time Message (Broadcasted to Online Participants)

```json
{
  "message": {
    "_id": "63480e68f4794709f802a2fa",
    "t": 15673838833,
    "from": "634ec51c0b65918393dca5bf",
    "body": "hey how is going?",
    "cid": "63480e68f4794709f802a2fa",
    "x": {
      "param1": "value",
      "param2": "value"
    },
    "attachments": [
      { "file_id": "123123_file_1", "file_name": "file_1" },
      { "file_id": "653534_file_2", "file_name": "file_2" }
    ],
    "created_at": "2023-07-04T07:23:53.308Z"
  }
}
```

---

### 📌 `POST /admin/message/system`

**Description**:  
Sends a **system message** to a specific list of user IDs. These are typically non-conversational messages (e.g., notifications, status updates). Only the specified online recipients will receive the message in real-time. For now, the admin/message/system message can only be caught in the console. 

---

#### 🔐 Authorization
- Required Header:  
  `Admin-Api-Key: {{HTTP_ADMIN_API_KEY}}`

---

#### 📥 Request

**Content-Type**: `application/json`

```json
{
  "organizationId": "680a2fae96cc69d78861f101",
  "senderId": "63480e68f4794709f802a2fa",
  "messageSystem": {
    "id": "5а34p21m0xj23",
    "uids": ["63480e68f4794709f802a2fc", "63480e68f4794709f802a2fb"],
    "x": {
      "param1": "value",
      "param2": "value"
    }
  }
}
```

---

#### 🧾 Request Parameters

| Field                     | Type               | Description                                                            |
|---------------------------|--------------------|------------------------------------------------------------------------|
| `organizationId`          | `string`            | **OrganizationId** performing request                                 |
| `senderId`                | `string`            | **User ID** of the sender                                             |
| `messageSystem.id`        | `string`            | Unique message ID received from the server                            |
| `messageSystem.uids`      | `array[string]`     | List of **recipient user IDs** (only online users will receive it)    |
| `messageSystem.x`         | `object`            | Custom metadata parameters (optional), e.g. `{ "event_type": "X" }`   |

---

#### ✅ Successful Response

```json
{
  "ack": {
    "mid": "5а34p21m0xj23",
    "t": 15673838833
  }
}
```

---

#### 📡 Real-time Message (Sent to Online Recipients)

```json
{
  "system_message": {
    "_id": "5а34p21m0xj23",
    "t": 15673838833,
    "from": "634ec51c0b65918393dca5bf",
    "x": {
      "param1": "value",
      "param2": "value"
    }
  }
}
```

---

### 📌 `PUT /admin/message/read`

**Description**:  
Marks one or more messages as **read** in a specific conversation. All users whose messages were marked as read will receive a real-time update.

---

#### 🔐 Authorization
- Required Header:  
  `Admin-Api-Key: {{HTTP_ADMIN_API_KEY}}`

---

#### 📥 Request

**Content-Type**: `application/json`

```json
{
  "organizationId": "680a2fae96cc69d78861f101",
  "senderId": "63480e68f4794709f802a2fa",
  "messageRead": {
    "cid": "63077ad836b78c3d82af0812",
    "ids": ["63480e68f4794709f802a2fa", "63077ad836b78c3d82af0866"]
  }
}
```

---

#### 🧾 Request Parameters

| Field                    | Type                | Description                                                       |
|--------------------------|---------------------|-------------------------------------------------------------------|
| `organizationId`         | `string`            | **OrganizationId** performing request                             |
| `senderId`               | `string`            | **User ID** marking the messages as read                          |
| `messageRead.cid`        | `string`            | **Conversation ID**                                               |
| `messageRead.ids`        | `array[string]`     | List of **Message IDs** that are being marked as read             |

---

#### ✅ Successful Response

```json
{
  "success": true
}
```

---

#### 📡 Real-time Message (Sent to Original Senders)

```json
{
  "message_read": {
    "cid": "63077ad836b78c3d82af0812",
    "ids": ["63480e68f4794709f802a2fa", "63077ad836b78c3d82af0866"],
    "from": "634ec51c0b65918393dca5bf"
  }
}
```

---

### 📌 `PUT /admin/message`

**Description**:  
Updates the body of a previously sent message. Only the sender can edit the message. All online participants of the conversation will receive the updated message in real-time.

---

#### 🔐 Authorization
- Required Header:  
  `Admin-Api-Key: {{HTTP_ADMIN_API_KEY}}`

---

#### 📥 Request

**Content-Type**: `application/json`

```json
{
  "organizationId": "680a2fae96cc69d78861f101",
  "senderId": "63480e68f4794709f802a2fa",
  "messageEdit": {
    "id": "63077ad836b78c3d82af0812",
    "body": "updated message body"
  }
}
```

---

#### 🧾 Request Parameters

| Field                     | Type     | Description                                                             |
|---------------------------|----------|-------------------------------------------------------------------------|
| `organizationId`          | `string` | **OrganizationId** performing request                                   |
| `senderId`                | `string` | **User ID** of the sender (must match the original message sender)      |
| `messageEdit.id`          | `string` | **Message ID** to be edited                                             |
| `messageEdit.body`        | `string` | New content for the message body                                        |

---

#### ✅ Successful Response

```json
{
  "success": true
}
```

---

#### 📡 Real-time Message (Broadcasted to Other Online Participants)

```json
{
  "message_edit": {
    "id": "63077ad836b78c3d82af0812",
    "body": "updated message body",
    "from": "63480e68f4794709f802a2fa"
  }
}
```

---

### 📌 `DELETE /admin/message`


**Description**:  
Deletes one or more messages in a conversation. The deletion behavior depends on the `type` field:
- `"myself"`: messages are deleted **only for the sender**
- `"all"`: messages are deleted **for all participants**, and a real-time notification is sent to online users in the conversation.

---

#### 🔐 Authorization
- Required Header:  
  `Admin-Api-Key: {{HTTP_ADMIN_API_KEY}}`

---

#### 📥 Request

**Content-Type**: `application/json`

```json
{
  "organizationId": "680a2fae96cc69d78861f101",
  "senderId": "63480e68f4794709f802a2fa",
  "messageDelete": {
    "cid": "63077ad836b78c3d82af0812",
    "ids": ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
    "type": "myself"
  }
}
```

---

#### 🧾 Request Parameters

| Field                       | Type               | Description                                                             |
|-----------------------------|--------------------|-------------------------------------------------------------------------|
| `organizationId`            | `string`           | **OrganizationId** performing request                                   |
| `senderId`                  | `string`           | **User ID** performing the deletion                                     |
| `messageDelete.cid`         | `string`           | **Conversation ID**                                                     |
| `messageDelete.ids`         | `array[string]`    | List of **Message IDs** to delete                                       |
| `messageDelete.type`        | `"myself" \| "all"`| Deletion type: for sender only (`myself`) or for all users (`all`)      |

---

#### ✅ Successful Response

```json
{
  "success": true
}
```

---

#### 📡 Real-time Message (if `type: "all"`)

```json
{
  "message_delete": {
    "cid": "63077ad836b78c3d82af0812",
    "ids": ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
    "type": "all",
    "from": "634ec51c0b65918393dca5bf"
  }
}
```

> ℹ️ If `type: "myself"` is used, the messages will be removed **only for the `senderId`**. No real-time event is broadcast to other users.

---


### 📌 `POST /admin/activity/online`


**Description**:  
Get online users list (ids only of full model) or count online users

---

#### 🔐 Authorization
- Required Header:  
  `Admin-Api-Key: {{HTTP_ADMIN_API_KEY}}`

---

#### 📥 Request

**Content-Type**: `application/json`

```json
{
  "organizationId": "680a2fae96cc69d78861f101",
  "userId": "63077ad836b78c3d82af0815",
  "limit": 10,
  "offset": 0,
  "count": false,
  "idsOnly": true
}
```

---

#### 🧾 Request Parameters

| Field                      | Type               | Description                                                             |
|----------------------------|--------------------|-------------------------------------------------------------------------|
| `organizationId`           | `string`           | **OrganizationId** performing request                                   |
| `userId`                   | `string`           | **User ID** performing the deletion                                     |
| `limit`                    | `int`              | limit numbers of users in response                                      |
| `offset`                   | `int`              | users to skip for pagination                                            |
| `count`                    | `boolean`          | receive only users count in response                                    |
| `idsOnly`                  | `boolean`          | receive only **User ID**s array in response                             |

---

#### ✅ Successful Response

```json
{
  "users":[
    "67ed122cffed69f6d9c5ffdb",
    "67ed11d9ffed69f6d9c5ffd5"
  ]
}
```

---
