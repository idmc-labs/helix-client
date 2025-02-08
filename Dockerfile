# -------------------------- Dev ---------------------------------------

FROM node:20-bookworm AS dev

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
        git bash g++ make \
    && git config --global --add safe.directory /code \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# -------------------------- Builder ---------------------------------------
FROM dev AS builder

COPY ./package.json ./yarn.lock /code/

RUN yarn install

COPY . /code/

# -------------------------- Nginx - Builder --------------------------------
FROM builder AS nginx-build

# Static
ENV REACT_APP_MMP_ENDPOINT=https://media-monitoring.idmcdb.org
ENV GRAPHQL_CODEGEN_ENDPOINT=https://helix-tools-api-staging.idmcdb.org/graphql

# Dynamic configs. Can be changed with containers. (Placeholder values)
# Using ./nginx-serve/apply-config.sh
ENV REACT_APP_ENV=REACT_APP_ENV_PLACEHOLDER
ENV REACT_APP_MAPBOX_ACCESS_TOKEN=REACT_APP_MAPBOX_ACCESS_TOKEN_PLACEHOLDER
ENV REACT_APP_SENTRY_DSN=REACT_APP_SENTRY_DSN_PLACEHOLDER
ENV REACT_APP_HCATPCHA_SITEKEY=REACT_APP_HCATPCHA_SITEKEY_PLACEHOLDER
ENV REACT_APP_GRAPHQL_ENDPOINT=https://REACT-APP-GRAPHQL-ENDPOINT-PLACEHOLDER.COM/
ENV REACT_APP_SWAGGER_ENDPOINT=https://REACT-APP-SWAGGER-ENDPOINT-PLACEHOLDER.COM/external-api/

ENV NODE_OPTIONS=--openssl-legacy-provider

RUN env > .env && yarn build

# ---------------------------------------------------------------------------
FROM nginx:1 AS nginx-serve

LABEL maintainer="IDMC"
LABEL org.opencontainers.image.source="github.com/idmc-labs/helix-client"

COPY ./nginx-serve/apply-config.sh /docker-entrypoint.d/
COPY ./nginx-serve/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=nginx-build /code/build /code/build

ENV APPLY_CONFIG__SOURCE_DIRECTORY=/code/build/
ENV APPLY_CONFIG__DESTINATION_DIRECTORY=/usr/share/nginx/html/
ENV APPLY_CONFIG__OVERWRITE_DESTINATION=true
