FROM node:17
WORKDIR /usr/src/xbacked-collector
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
