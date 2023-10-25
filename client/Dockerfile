FROM node:18 as builder
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT 3000
CMD [ "npm", "run", "dev" ]
