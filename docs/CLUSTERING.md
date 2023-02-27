# Clustering

The SAMA server supports clustering out of the box.
You either can run a cluster between separated phisical servers or run it on a same machine with multipel SAMA-server instances running.

The following commands are the way to go:

- Run `docker-compose up` to run dependant services (MongoDB, Minio)
- Run multiple SAMA-server instances
  - either open multiple terminal consols, call multiple `npm run start` and set `APP_PORT` env to a diff value
  - or remove `APP_PORT` env and run multiple nodes via `pm2` command: `pm2 start pm2.config.cjs`. This command will spine as many instances as defined in `pm2.config.cjs` file in `instances` value.
- Setup nginx balancer:
  - open `nginx/default.conf` and provide all the IPs of all runing nodes. If you run it locally - you need to provide private IPs of your machine, not localhost/127.0.0.1
  - Run nginx balancer `docker-compose -f docker-compose-nginx-balancer.yml up --build`
- The cluster will be listening at port `9000`, so you can point SAMA-client to this port and test.
