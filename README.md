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

## Authentication

Login+pwd initially

## Transport

* WSS
* TLS socket (for later purpose ?)

## Send/Receive messages

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

## Sent status

On each message sent to server - a server will deliver back to client a simple packet with message id and timestamp at which the message was stored in DB sp both sender & recipient will have same date sent time stored:

`{'ack': {'mid': 'xyz', 't': 15673838833}}`

## Delivered status

```
{
  'delivered': {
    'id': 'xyz', 
    't': 15673838833,
    'to': '',
    'from': '',
    'mid': 'zyx'
    'cid': 'xcv'
  }
}
```

## Read status

```
{
  'read': {
    'id': 'xyz', 
    't': 15673838833,
    'to': '',
    'from': '',
    'mid': 'zyx',
    'cid': 'xcv'
  }
}
```

## Typing

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


## Delete message

TBA

## Edit message

TBA

## Carbons

Carbons is enabled by default.  On send - a message will be delivered back to all active sender's devices except the current one.  

The packet is a simple 'carbon' wrapper around original message. 

```
{
 'carbon': {
  'message': {
    'id': 'xyz', 
    't': 15673838833,
    'to': '',
    'from': '',
    'body': 'hey how is going?',
    'x': {
      'param1': 'value',
      'param2': 'value'
    }
  }
 } 
}
```

## Chat history storage

All the messages are automatically stored in DB and then can be retrieved via REST API

## Offline message delivery

I see 2 potential solutions here:

* No offline storage at all
* Offline messages delivery is supported for all types of messages, but there is a TTL at server side

so TBD

## Contacts list

Via REST API. 
* Upload complete address book
* CRUD on contacts

## Last activity

TBA

## Attachments

Upload attachments to server and send a fid to opponents, so they will build an url and download it. 

## Block list

Via REST API. Can block, unblock and list blocked users. 

## IDC - inter deployments communication

Will support it on a later stage

## REST API

* User signup
* User signin
* User edit
* Search user
* Create chat
* List chats
* Edit chat
* List chat messages
* (Send chat message)
* (Delete chat message)
* (Edit chat mesage)
* Upload attachment
* Get attachment by url
* Block user
* Unblock user
* List blocked users
