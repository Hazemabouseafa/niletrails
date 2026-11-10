FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 1111
ENV PORT=1111
CMD ["node", "server.js"]
