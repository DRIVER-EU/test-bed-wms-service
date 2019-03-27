FROM node:8.15-stretch as builder
RUN mkdir -p ./code
COPY . /code
WORKDIR /code
RUN npm i
RUN npm i -g typescript
RUN npm run build
RUN tsc

# FROM node:10.15-stretch-slim
# RUN mkdir -p /server/node_modules
# COPY --from=builder /code/dist /server
# COPY --from=builder /code/node_modules /server/node_modules
# WORKDIR /server
# RUN ls /server
# EXPOSE 5101
# CMD ["node", "cli.js"]
