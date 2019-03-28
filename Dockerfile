FROM node:8.15-stretch as builder
RUN npm i -g typescript
RUN mkdir -p ./code
COPY package.json /code/package.json
WORKDIR /code
RUN npm i
COPY . .
RUN npm run build

FROM node:8.15-stretch-slim
RUN mkdir -p /server/node_modules
COPY --from=builder /code/dist /server
COPY --from=builder /code/styles /server/styles
COPY --from=builder /code/node_modules /server/node_modules
WORKDIR /server
EXPOSE 5101
CMD ["node", "cli.js", "-t", "-e", "http://localhost", "-q", "5101"]
