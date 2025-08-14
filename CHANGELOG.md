# Changelog

## 0.34.0

### Updated

- Added `forwarded_message_id` field for Message object

## 0.33.0

### Improvements

- Extended `message_list` request with `ids` param
- Added public conversations

### Updated

- Added `replied_message_id` field for Message object

## 0.32.0

### Improvements

- Extended allowed fields for the `attachments` field in the `Message` object
- Added message reactions support

### Updated

- Added a handler for fetch logic in conversation handler
- Added image support for conversation handler
- Updated mongo/redis connection providers

## 0.31.0

### Improvements

- Implemented support for conversation schemes for programmable chat
- Updated API requests for 1-on-1 chats
- Added support for checking if a user belongs to a specific organization

### Updated

- Improved real-time “Online” status updates for better compatibility with mobile apps
- Updated project startup commands
- Added more different users for get_participants_by_cids response

## 0.30.0

### Improvements

- Added message admin api
- Minor fixes for validation in the `conversation_list` query

### Docker

- Improved logic for building the Docker container

## 0.29.0

### Updated

- Migrated server to Node v22.14
- Updated mongoDB to v6.0
- Removed notification when creating a 1-1 chat

### Improvements

- Added suport for `lt` for `conversation_list` request
- Added `conversation` field to the response to the `get_participants_by_cids` request

### Docker

- Improved logic for building the Docker container

## 0.28.0

### Feature

- Implemented a progressive authentication flow to enhance security
- Added a load testing scheme

### Updated

- Updated `user_search` query param (`login` -> `keyword`)
- Changed status for `Unauthorized` error

## 0.27.0

### Improvements

- Extended the `conversation_list` request to allow requesting conversations by ids

### Updated

- Updated indexes of the `push_subscriptions` collection
- Removed the `platform` field from the `pushEvent` object

## 0.26.0

### Features

- Implemented a new docker flow for the project build
- Added `device_token` field for `push_sbuscription_create` request

### Updated

- Сhanged development flow
- Updated environment variables
- Updated tests for status typing

## 0.25.0

### Features

- Initiated support for user avatars
- Implemented group chat avatar support
- Integrated ‘typing’ indicator for one-to-one and group chats

### Updated

- Resolved issue causing notifications to be sent to users after exiting a chat

## 0.24.0

### Updated

- Updates to DI (moved more code to DI containers)

## 0.23.0

### Features

- Added prettier
- Added new method `get_users_by_ids` for UserController
- Implemented search for conversations by name
- Implemented a system message: [user_name] left the chat
- Implemented a system message about updating chat fields

### Updated

- Updated some errors on login/signup functionality
- Removed the error when a user was stayed alone in the group chat

## 0.22.0

### Features

- Implemented System Message API
- Added Session extra params

### Updated

- Added system Message API for conversation event messages

## 0.21.0

### Added

- Implemented Dependency Injection(DI) providers ConversationService/ConversationRepository/ConversationParticipantRepository
- Implemented DI providers MessageService/MessageRepository/MessageStatusRepository

### Updated

- Moved ConversationController methods logic to DI conversation operations
- Moved MessageController methods logic to DI message operations

## 0.20.0

### Features

- We have updated the server’s architecture to support multiple protocols, such as JSON and XMPP, thereby enhancing its versatility and compatibility.

## 0.12.0

### Features

- Implemented the cache for attachments links. This will allow to preserve the same attachment’s link across multiple requests during the last hour (configurable via FILE_DOWNLOAD_URL_EXPIRES_IN env).
- Added a new field `file_blur_hash` for all attachments included in the message. The field is needed to display a **blurred** image while the full image is being loaded from the server.
- Optimized the **process** the project deployment.

## 0.11.0

### Features

- Implemented the event of adding users to the created group
- Implemented the event of removing users from a group

## 0.0.1

### Features

- Implemented a system of controllers:
  - added a Activities controller
  - added a Contacts controller
  - added a Conversation controller
  - added a Files controller
  - added a Messages controller
  - added a Operation Logs controller
  - added a Push Notifications controller
  - added a Status controller
  - added a Users Block controller
  - added a Users controller
- Implemented tests for all controller methods
- Created a common route navigation for distributing requests
- Added validation for all possible requests for all controllers

### Storage

- Added migrations for the database
- Implemented saving files using minio
- Implemented a controller for communication with MongoDB
- Implemented a system for saving user sessions and user activity

### Technical

- Added docker files
- An algorithm for clustering a server with pm2 support is developed

## 0.0.1 (Example)

### Important Notes

- **Important**: Removed something
- **Important**: Updated something
- App now requires something

### Maintenance

- Removed a redundant feature
- Added a new functionality
- Improved overall performance
  - Enhanced user interface responsiveness

### Docker

- Added `Dockerfile`

### Features

- :tada: Implemented a new feature
  - This feature allows users to...
- Added a user profile customization option

### Bug Fixes

- Fixed a critical issue that caused...
