FROM mileiisc/angular-build-image AS compile-image

WORKDIR /opt/ng
COPY package.json angular.json tsconfig.app.json tsconfig.base.json tsconfig.json tsconfig.spec.json tslint.json ./
RUN rm -rf ./src
COPY src ./src
COPY backend ./backend

RUN npm install

RUN npm run build-prod

COPY README.md ./
RUN npm install -g marked
RUN marked -o backend/OCR-WEB-UI/help.html README.md
COPY docs ./backend/OCR-WEB-UI/docs

FROM node:14.15.3-alpine3.11

COPY --from=compile-image /opt/ng/backend /app
RUN cd /app; npm install

ENV NODE_ENV production
ENV PORT 8080
EXPOSE 8080

WORKDIR /app
CMD [ "npm", "start" ]