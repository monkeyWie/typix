FROM node:22
WORKDIR /app
RUN npm i -g pnpm
COPY ./package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm build:node
EXPOSE 3000
CMD ["node", ".bin/node.js"]