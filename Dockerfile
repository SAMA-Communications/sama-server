FROM node:22.14.0 as builder

WORKDIR /app

COPY package*.json ./

RUN npm install 

COPY . .

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app /app

CMD ["npm", "run", "start"]
