FROM node:22

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 8080

CMD [ "npm", "start" ]
