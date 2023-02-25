# SAMA - Simple but Advanced Messaging Alternative - Server

<img width="597" alt="Screenshot 2022-12-31 at 14 15 04" src="https://user-images.githubusercontent.com/70977170/210136404-b1811eaa-b058-4fd4-a7db-14b8d059a118.png">

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

- Make sure you have `Node 18` installed.
- Copy `.env.example` to `.env`.
- Run `docker-compose up` to run dependant services (MongoDB, Minio)
- Open `http://localhost:9011/access-keys`, create Access Keys and set `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` in `.env`.
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