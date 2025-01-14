FROM node:alpine
WORKDIR /app
COPY mgs/package*.json ./
RUN npm install
COPY mgs/*.js ./
ENV SAFELOW=30
ENV STANDARD=60
ENV FAST=90
ENV FASTEST=100
ENV RPC=""
ENV BUFFERSIZE=10000
ENV HOST=0.0.0.0
ENV PORT=7000
EXPOSE ${PORT}
ENTRYPOINT [ "node", "index.js" ]
