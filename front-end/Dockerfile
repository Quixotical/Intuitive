FROM node:8.9
EXPOSE 80

ADD . /opt/src/app

WORKDIR /opt/src
RUN npm install -g serve rollup
RUN npm init -y
RUN npm install page rollup-plugin-css-only

WORKDIR /opt/src/app
CMD rollup -cw & serve -s -p 80 -C public
