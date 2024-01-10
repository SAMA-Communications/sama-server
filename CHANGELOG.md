# Changelog

## 0.12.0

### Features

- Implemented storage for links to attached files in redis. This will help us **not** to generate **different** links to the file every time, but to return the **same link** if there has been a demand for it in the last hour.
- Added a new field `file_blur_hash` for all attachments included in the message. The field is needed to display a **blurred** image while the full image is being loaded from the server.
- Optimized the **process** of deploying our project on your device. All variables required for the system to work correctly are now run with a **single** command. For more information, check out the pull request - [One-command docker deployment #77](https://github.com/SAMA-Communications/sama-server/pull/77).

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
