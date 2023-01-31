FROM node:14 as base

WORKDIR /backend

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

FROM base as dev

RUN npm install

COPY . .

CMD npm run dev

FROM base as production

RUN npm install

COPY . .
RUN npm run build
CMD npm start

