FROM node
COPY node_modules /tmp/node_modules
COPY zdungeon.z5 /tmp/zdungeon.z5
CMD node /tmp/node_modules/.bin/zvm /tmp/zdungeon.z5 