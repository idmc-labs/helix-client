FROM node:16.20.2-bullseye

# RUN yarn install --network-concurrency 1
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends git \
    && git config --global --add safe.directory /code \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code
