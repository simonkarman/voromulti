FROM node:18 as builder
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ENV PORT 3000
CMD [ "npm", "start" ]
