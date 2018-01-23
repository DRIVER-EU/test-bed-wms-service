FROM node:alpine

# Create app directory
RUN mkdir -p /src
WORKDIR /src

# If you have native dependencies, you'll need extra tools
RUN apk add --no-cache make gcc g++ python git
RUN npm install -g node-gyp typescript bower

# Install app dependencies
COPY package.json /src/
COPY yarn.lock /src/
RUN yarn

# Bundle app source
COPY . /src/
RUN mkdir -p /root/wms-server

# Enables customized options using environment variables
ENV WMS_PORT='3355'

# Run App
EXPOSE 3355

RUN yarn install --production
WORKDIR /src
RUN tsc

CMD ["yarn", "start"]
