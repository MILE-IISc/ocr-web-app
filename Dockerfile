FROM node:14.15.3 AS compile-image

WORKDIR /opt/ng
COPY package.json angular.json tsconfig.app.json tsconfig.base.json tsconfig.json tsconfig.spec.json tslint.json ./
COPY src ./src
COPY backend ./backend
COPY README.md ./
COPY docs ./backend/OCR-WEB-UI/docs

RUN npm install

RUN npm install -g @angular/cli@10.0.8
RUN ng build --prod

RUN npm install -g marked
RUN marked -o backend/OCR-WEB-UI/help.html README.MD

FROM node:14.15.3-alpine3.11

COPY --from=compile-image /opt/ng/backend /app
RUN cd /app; npm install

ENV NODE_ENV production
ENV PORT 8080
EXPOSE 8080

WORKDIR /app
CMD [ "npm", "start" ]