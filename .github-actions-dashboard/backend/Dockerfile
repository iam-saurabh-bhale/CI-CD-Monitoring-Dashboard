FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* /app/
RUN npm install --omit=dev
COPY src/ /app/src/
COPY sql/ /app/sql/
ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm","start"]
