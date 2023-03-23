FROM node:16 as ts-compiler
WORKDIR /usr/src/xbacked-collector
COPY package*.json ./
COPY tsconfig*.json ./
ADD .yarn ./.yarn
COPY .yarnrc.yml ./
RUN yarn install
COPY . ./
RUN npm run build:release

FROM node:16 as ts-remover
WORKDIR /usr/src/xbacked-collector
COPY --from=ts-compiler /usr/src/xbacked-collector/package*.json ./
COPY --from=ts-compiler /usr/src/xbacked-collector/build ./
COPY --from=ts-compiler /usr/src/xbacked-collector/node_modules ./node_modules

FROM gcr.io/distroless/nodejs:16
WORKDIR /usr/src/xbacked-collector
COPY --from=ts-remover /usr/src/xbacked-collector ./
USER 1000
CMD ["src/main.js"]