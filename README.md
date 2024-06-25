# SAMA - Simple but Advanced Messaging Alternative - Chat server

#### Powered by [`uWebSockets.js`](https://github.com/uNetworking/uWebSockets.js/)

<div align="left">
  
[![Last commit](https://img.shields.io/github/last-commit/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/issues)
[![GitHub stars](https://img.shields.io/github/stars/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/stargazers)
[![GitHub license](https://img.shields.io/github/license/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/blob/master/LICENSE)
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

## Development

- Make sure you have `Node 18.20.x` installed.
- Copy `.env.example` to `.env`.
- Run `docker-compose up` to run dependant services (MongoDB, Minio, Redis)
- `npm install` to install dependencies
- `npm run migrate-mongo-up` to run DB migrations
- `npm run start` to run server

There are also other components. Make sure to check [Deploying SAMA chat server stack: a comprehensive guide](https://medium.com/sama-communications/deploying-sama-chat-server-stack-a-comprehensive-guide-294ddb9a2d78)

### Docker one-command deployment

To build and run the `SAMA` with all dependencies, you can use the following command:

```
docker-compose -f docker-compose-full.yml up --build
```

If you only want to run dependency services (for local development without Docker), use this command:

```
docker-compose up
```

Run dependency services with `SAMA` main apps:

```
RUN_SAMA=true docker-compose up --build
```

:warning: If you are using MacOS or Windows, and want run `SAMA` apps, add these two variables before the launch command:
MacOS

```
MINIO_ENDPOINT=$(ipconfig getifaddr en0) MINIO_PORT=9010
```

Windows

```
$env:MINIO_ENDPOINT = (Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and $_.IPAddress -match '^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.' } | Select-Object -ExpandProperty IPAddress)[1]; $env:MINIO_PORT = 9010;
```

If you are encountering issues with attachments in the web client, it suggests that an error occurred in the first variable. To resolve this, you can simply update the code segment with the private IP address of your machine.

Now you can access apps at the following addresses:

- [Server-API](http://localhost:9000)
- [Web-Client](http://localhost:3000)
- [Minio-API](http://localhost:9010)
- [Minio-Client](http://localhost:9011)
- [Push-dashboard](http://localhost:3001/ui)
- [Server-dashboard](http://localhost:9002)
- [Redis-commander](http://localhost:8081)

### Docker e2e tests

Run migrations:

```
docker-compose exec sama-server sh -c "MONGODB_URL=mongodb://172.25.0.4/samatests npm run migrate-mongo-up"
```

Run e2e tests:

```
docker-compose exec sama-server sh -c "MONGODB_URL=mongodb://172.25.0.4/samatests npm run test"
```

## Public cloud DEMO

The whole SAMA stack can be tested using https://app.samacloud.io public cloud.

## API

[API reference](docs/API.md)

Also, there is a set of detailed articles for each API:

- [Users API](https://medium.com/sama-communications/sama-chat-server-api-users-edf65ea6a341)
- [Conversations API](https://medium.com/sama-communications/sama-chat-server-api-conversations-1ae505b07d17)
- [Messages API](https://medium.com/sama-communications/sama-chat-server-api-messages-dc00e9684dc0)
- [Activities API](https://medium.com/sama-communications/sama-chat-server-api-activities-97b712b88671)
- [Address Book API](https://medium.com/sama-communications/sama-chat-server-api-address-book-f297ce25faa1)
- [Push Notifications API](https://medium.com/sama-communications/sama-chat-server-api-push-notifications-7e904eb04a0c)

## Custom DI container

An example how to create and use provider:

1. Create folder `app/providers/services/my_provider` with 2 files `index.js` and `Provider.js`

2. `index.js` should contain the implementation of the service itself:

```js
export default class MyProvider {
  constructor(redisConnection, userRepo) {
    this.redisConnection = redisConnection
    this.userRepo = userRepo
  }

  async updateAction(ws, fields) {
    const id = await this.redisConnection.client ...
    const updatedUser = await this.userRepo.update ....
    ....
    return updatedUser
  }
}
```

3. `Provider.js` should export an instance of RegisterProvider which contains instructions how to create an instance of `index.js` class with dependencies:

```js
import RegisterProvider from "@sama/common/RegisterProvider.js"
import MyProvider from "./index.js"

const name = "MyProvider"

class MyProviderRegistration extends RegisterProvider {
  register(slc) {
    const redisConnection = slc.use("RedisClient")
    const userRepo = slc.use("UserRepository")

    return new MyProvider(redisConnection, userRepo)
  }
}

export default new MyProviderRegistration({ name, implementationName: MyProvider.name })
```

4. Then, add export of `Provider.js` to `app/providers/index.js`

```js
import UserRepoProvider from "./repositories/user/Provider.js"
...
...
import MyProviderRegistration from "./services/my_provider/Provider.js"

const providers = [
  UserRepoProvider,

  ...
  ...

  MyProviderRegistration
]

export default providers
```

5. For any custom APIs providers - use `/APIs/[API_NAME]/providers/index.js` file:

6. And now yiou can use `MyProvider` class where needed, e.g. in controller:

```js
import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

class Controller {
  async edit(ws, data) {
    const myProvider = ServiceLocatorContainer.use("MyProvider")
    const updatedUser = await myProvider.updateAction(ws, data)
    ....
  }
}
```

## Clustering

[Clustering documentation](docs/CLUSTERING.md)

## Roadmap

[Roadmap](docs/ROADMAP.md)

## License

[GPL-3.0](LICENSE)

## Help us!

Any thoughts, feedback is welcome! Please create a GitHub issue for any feedback you have.

Want to support us with [some coffee?](https://www.buymeacoffee.com/khomenkoigor). Will be much appreciated!
