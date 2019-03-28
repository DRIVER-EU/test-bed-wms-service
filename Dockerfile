FROM node:8.15-stretch as builder
RUN npm i -g typescript
RUN mkdir -p ./code
COPY package.json /code/package.json
WORKDIR /code
RUN npm i
COPY . .
RUN npm run build

# FROM node:10.15-stretch-slim
# RUN mkdir -p /server/node_modules
# COPY --from=builder /code/dist /server
# COPY --from=builder /code/node_modules /server/node_modules
# WORKDIR /server
# RUN ls /server
# EXPOSE 5101
# CMD ["node", "cli.js"]
