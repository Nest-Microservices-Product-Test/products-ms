FROM node:20.18.0-alpine

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install -g @nestjs/cli

RUN npm install

COPY . .

EXPOSE 3001