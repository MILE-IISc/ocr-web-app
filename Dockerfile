FROM node:14.15.3 AS compile-image

WORKDIR /opt/ng
COPY package.json angular.json src backend nodemon.json tsconfig.app.json tsconfig.base.json tsconfig.json tsconfig.spec.json tslint.json ./

RUN npm install
RUN npm install -g @angular/cli@10.0.8

RUN ng build --prod

FROM 14.15.3-alpine3

COPY --from=compile-image /opt/ng/backend /app/backend
COPY package.json /app

ENV NODE_ENV production
ENV PORT 8080
EXPOSE 8080

WORKDIR "/app"
CMD [ "npm", "start:server" ]