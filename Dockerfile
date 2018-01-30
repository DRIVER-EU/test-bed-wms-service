FROM node:8-alpine

# Create app directory
RUN mkdir -p /src
WORKDIR /src

# If you have native dependencies, you'll need extra tools
RUN apk add --no-cache make gcc g++ python git libc6-compat
RUN apk add gdal --update-cache --repository http://nl.alpinelinux.org/alpine/edge/testing --allow-untrusted
RUN yarn global add node-gyp typescript

# Install app dependencies
COPY package.json /src/
COPY yarn.lock /src/
RUN yarn

# Bundle app source
COPY . /src/
RUN mkdir -p /root/wms-server

# Enables customized options using environment variables
ENV WMS_PORT='3355'
ENV GDAL_DATA='/usr/share/gdal/'
ENV PROJ_LIB='./node_modules/mapnik/lib/binding/share/proj/'

# Run App
EXPOSE 3355

RUN yarn install --production
WORKDIR /src
RUN tsc

CMD ["yarn", "start"]
