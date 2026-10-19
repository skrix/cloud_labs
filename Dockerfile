FROM node:24.21.0-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY .sequelizerc ./
COPY api ./api
COPY src ./src

USER node
EXPOSE 3000

CMD ["node", "src/server.js"]
