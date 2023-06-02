# SAMA - Simple but Advanced Messaging Alternative - Server

#### Powered by [`uWebSockets.js`](https://github.com/uNetworking/uWebSockets.js/)

<div align="left">
  
![Last commit](https://img.shields.io/github/last-commit/SAMA-Communications/sama-server)
[![GitHub issues](https://img.shields.io/github/issues/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/issues)
[![GitHub stars](https://img.shields.io/github/stars/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/stargazers)
[![GitHub license](https://img.shields.io/github/license/SAMA-Communications/sama-server)](https://github.com/SAMA-Communications/sama-server/blob/master/LICENSE)
![GitHub language count](https://img.shields.io/github/languages/count/SAMA-Communications/sama-server) 
![GitHub top language](https://img.shields.io/github/languages/top/SAMA-Communications/sama-server)

</div>

<img width="597" alt="Screenshot 2022-12-31 at 14 15 04" src="https://user-images.githubusercontent.com/70977170/210136404-b1811eaa-b058-4fd4-a7db-14b8d059a118.png">

## Motivation

The intention of our messaging protocol and chat server, which are different from others, is to provide an alternative solution to the wide spread XMPP messaging protocol (and to be honest — the only wide spread ‘standard’ these days).

Read a complete medium post **Introducing SAMA** about what is SAMA and what problems we are trying to solve with it 
https://medium.com/sama-communications/introducing-sama-simple-but-advanced-messaging-alternative-chat-server-524a532e2040

## Development

- Make sure you have `Node 18` installed.
- Copy `.env.example` to `.env`.
- Run `docker-compose up` to run dependant services (MongoDB, Minio, Redis)
- Open `http://localhost:9011/access-keys`, create Access Keys and set `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` in `.env`. To access the minio dashboard, you need to enter `MINIO_ROOT_USER` from `docker-compose.yml` as for the `username` field and `MINIO_ROOT_PASSWORD` as for the `password` field. 
- `npm install` to install dependencies 
- `npm run migrate-mongo-up` to run DB migrations 
- `npm run start` to run server

There is also a frontend app which can be uses with server https://github.com/SAMA-Communications/sama-client

## API

[API documentation](docs/API.md)

## Clustering

[Clustering documentation](docs/CLUSTERING.md)

## Roadmap

[Roadmap](docs/ROADMAP.md)

## License 

[GPL-3.0](LICENSE)

## Help us!

Any thought, feedback is welcome!
