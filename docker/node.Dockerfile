FROM node:13.2-alpine

RUN echo http://dl-2.alpinelinux.org/alpine/edge/community/ >> /etc/apk/repositories

RUN apk --no-cache add shadow

ARG CURRENT_USER
RUN usermod -u ${CURRENT_USER? invalid argument} node
RUN groupmod -g ${CURRENT_USER? invalid argument} node
RUN npm install -g nodemon

WORKDIR /var/www
USER node