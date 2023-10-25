FROM node:18 as builder
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
COPY server.ts ./
ENV PORT 8082
CMD [ "npm", "start" ]
