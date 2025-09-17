
FROM node:20-alpine
WORKDIR /app
COPY package.json /app/
RUN npm install --only=prod
COPY server.js /app/
EXPOSE 3000
CMD ["npm", "start"]
