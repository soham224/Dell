# build env
FROM node:18-alpine as build
WORKDIR /app
COPY patches ./patches
COPY package*.json ./
RUN npm i
COPY . ./
RUN npm run build

# production env
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
