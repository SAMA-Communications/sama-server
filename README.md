# SAMA - Simple but Advanced Messaging Alternative - Chat server

#### Powered by [`uWebSockets.js`](https://github.com/uNetworking/uWebSockets.js/)

<div align="left">
  
[![Last commit](https://img.shields.io/github/last-commit/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/issues)
[![GitHub stars](https://img.shields.io/github/stars/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/stargazers)
[![GitHub license](https://img.shields.io/github/license/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/blob/master/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-8A2BE2)](https://docs.samacloud.io/)
![GitHub language count](https://img.shields.io/github/languages/count/SAMA-Communications/sama-server) 
![GitHub top language](https://img.shields.io/github/languages/top/SAMA-Communications/sama-server)

![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white)
![AWS](https://img.shields.io/badge/Amazon_AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)

</div>

<img width="597" alt="Screenshot 2022-12-31 at 14 15 04" src="https://user-images.githubusercontent.com/70977170/210136404-b1811eaa-b058-4fd4-a7db-14b8d059a118.png">

## Motivation

The intention of our messaging protocol and chat server, which are different from others, is to provide an alternative solution to the wide spread XMPP messaging protocol (and to be honest — the only wide spread ‘standard’ these days).

Read complete medium posts **Introducing SAMA** and **What is SAMA** about what is SAMA and what problems we are trying to solve with it:

- https://medium.com/sama-communications/introducing-sama-simple-but-advanced-messaging-alternative-chat-server-524a532e2040
- https://medium.com/sama-communications/what-is-sama-a6d9045fd69a

Clients:

- Frontend Web app https://github.com/SAMA-Communications/sama-client
- Flutter app https://github.com/SAMA-Communications/sama-client-flutter

## Development & Deployment

[Local Development / Compete Deployment & E2E Tests](https://docs.samacloud.io/deployment/docker-server-setup/)

## DEMO

The whole SAMA stack can be tested using https://app.samacloud.io public cloud.

## Documentation

API reference: https://docs.samacloud.io

Also, there is a set of detailed articles for each API on Medium:

- [Users API](https://medium.com/sama-communications/sama-chat-server-api-users-edf65ea6a341)
- [Conversations API](https://medium.com/sama-communications/sama-chat-server-api-conversations-1ae505b07d17)
- [Messages API](https://medium.com/sama-communications/sama-chat-server-api-messages-dc00e9684dc0)
- [Activities API](https://medium.com/sama-communications/sama-chat-server-api-activities-97b712b88671)
- [Address Book API](https://medium.com/sama-communications/sama-chat-server-api-address-book-f297ce25faa1)
- [Push Notifications API](https://medium.com/sama-communications/sama-chat-server-api-push-notifications-7e904eb04a0c)

## Community and Support

Join our community for support and discussions:

- [GitHub Issues - SAMA server](https://github.com/SAMA-Communications/sama-server/issues), [GitHub Issues - SAMA client](https://github.com/SAMA-Communications/sama-client/issues), [GitHub Issues - SAMA Flutter client](https://github.com/SAMA-Communications/sama-client-flutter/issues)
- [SAMA on Medium](https://medium.com/sama-communications)
- Get help - [Discord 💬](https://discord.gg/bHSm9a7DpC)

## License

[GPL-3.0](LICENSE)

## Help us!

Any thoughts, feedback is welcome! Please create a GitHub issue for any feedback you have.

Want to support us?

<a href="https://www.buymeacoffee.com/khomenkoigor" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

<!-- GitAds-Verify: 35EQ2ZS2ZWQJ4EF324OI3WJ83GY8BDGX -->

## Node Clustering

### What data is stored in Redis by each node ?

#### sama-node-data

Record key in redis like `sama-node-data:{node-endpoint}` where `{node-endpoint}` ws url like `ws://192.168.1.13:55495/`, so redis record will be `sama-node-data:ws://192.168.1.13:55495/`. The record is HSET with ttl that equal config value `ws.cluster.nodeExpiresIn` in seconds + 5 seconds. The record has key/values like `ip/port/host` etc.

#### sama-node-users

Record key in redis like `sama-node-users:{node-endpoint}`. The record is SET that contains list user users connected to this node, user item is string like `{organizationId}:{userId}:{deviceId}`. Item example: `683db8ecdb9dee54f53304c0:683db9ed29aecb9feb4afb73:38400000-8cf0-11bd-b23e-10b96e40000d`

#### sama-user-devices

Record key in redis like `sama-user-devices:{organizationId}:{userId}`. The record is SET that contains list user devices ids connected to all nodes. Item example: `38400000-8cf0-11bd-b23e-10b96e40000d`

#### sama-user-data

Record key in redis like `sama-user-data:{userId}:{deviceId}`. The record in HSET that contains extra user session data e.g. active/inactive status

### How nodes discover each other ?

Each node write record key in Redis like `sama-node-data:{node-endpoint}` where `{node-endpoint}` it is own ws url. Node create this record on start and update on sync cluster (check method `syncCluster`). In sync method node retrieve all records from Redis with prefix `sama-node-data:`, the parse record ws url part (`{node-endpoint}`) and try establish ws connection if it doesn't already exist.


### How nodes connect to each other ?

If node-A does not have establish connection with node-B, node-A will create ws connection (check method `createConnectionWithNode`). When ws with node-B endpoint (`node-endpoint`) successfully opened - node-A send like 'ping' message with own network data (`ip/port/host` etc.) to node-B (check method `shareCurrentNodeInfo`), node-B send to node-A like 'pong' message with own network data, node-A after receiving 'pong' message - connection successfully established and handshake finished, app resolve promise and save ws connection in local object (check prop `clusterNodesConnections`). Node-B after send 'pong' message start connecting with node-A by same flow

#### What happens when connection breaks between 2 nodes ?

If connecting breaks between 2 nodes, node detect it by ws event close, and start reconnecting (check method `startNodeReconnecting` and `promiseQueueWithJittering`, prop `closeNodesConnections`), this method try 3 time create connection until the first successful with delay '1/4/9 seconds', flow like 1 second delay - try connect (if success return) - 4 seconds delay - try connect (if success return) - 9 seconds delay - try connect (if success return) - failed

### What happens when new node added to cluster ?

2 Ways (node-A,node-B - running, node-C - new node in cluster)

- Flow `How nodes discover each other` and then `How nodes connect to each other`. Node-C retrieve redis records (`sama-node-data`) created by node-A,node-B and create ws connections with each node (open ws and then connect flow with 'ping'/'pong').

- Node-A,node-B in method `syncCluster` with call with interval that equal config value `ws.cluster.nodeExpiresIn` in ms, retrieve `sama-node-data` records and see new node record created by node-C and then create connection with node-C

### What happens when existing node removed from cluster ?

Example with node-A and node-B

When node-B disconnect from cluster, ws connection breaks and node-A start reconnecting with node-B but it will not be success.
Then on next `syncCluster` iteration (or next + 1 iteration) node-A can't find node-B record in `sama-node-data` records, but has active reconnecting state with node-B, then mean that node-B destroyed because no-one update node-B `sama-node-data` record ttl, then node-A cancel reconnecting and clean redis data creates by node-B (`sama-node-users`/`sama-user-devices`/`sama-user-data`), `sama-node-data` already deleted by redis ttl.

#### Conditions when node mark other nodes like destroyed and should clean data ?

It can be detected no `syncCluster` iteration

- If have active node record `sama-node-users` w/o ttl, but do not have record `sama-node-data` - no-one update record so node is destroyed
- If do not have node record `sama-node-data` but has reconnecting state
- If have connection (check prop `clusterNodesConnections`) but do not have record `sama-node-data` (case when some how ws close was not called)

#### How its data is cleared from Redis ?

Check method `cleanDestroyedNodeData` that clean destroyed node data by node-endpoint.
Flow:
- retrieve `sama-node-users` - list of user who was connected to destroyed node
- delete 'smembers' from `sama-user-devices`
- delete `sama-user-data` record
- delete `sama-node-users`
