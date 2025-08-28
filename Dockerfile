FROM node:22
LABEL maintainer="monkeyWie"
WORKDIR /app
RUN npm i -g pnpm
COPY ./package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm build:node
EXPOSE 9999
CMD ["node", ".bin/node.js"]