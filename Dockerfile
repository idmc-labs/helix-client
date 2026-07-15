# -------------------------- Dev ---------------------------------------

FROM node:20-bookworm AS dev

ENV NODE_OPTIONS=--openssl-legacy-provider
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.9.0 --activate

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
        git bash g++ make \
    && git config --global --add safe.directory /code \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# -------------------------- Builder ---------------------------------------

FROM dev AS builder

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm install --frozen-lockfile

COPY . /code/

# -------------------------- Web App Serve - Builder ------------------------

FROM builder AS web-app-serve-build

# Default (overridable) configs. Any valid dummy — only needs to pass env.ts
# schema validation; the real default is baked in the final stage.
ENV REACT_APP_MMP_ENDPOINT=https://web-app-serve-placeholder.com

# Dynamic configs. Can be changed with containers. (Placeholder values)
# Using ./web-app-serve/apply-config.sh
ENV REACT_APP_ENV=web-app-serve-placeholder
ENV REACT_APP_GRAPHQL_ENDPOINT=https://web-app-serve-placeholder.com/graphql
ENV REACT_APP_GRAPHIQL_ENDPOINT=https://web-app-serve-placeholder.com/graphiql
ENV REACT_APP_SWAGGER_ENDPOINT=https://web-app-serve-placeholder.com/external-api/
ENV REACT_APP_MAPBOX_ACCESS_TOKEN=web-app-serve-placeholder
ENV REACT_APP_SENTRY_DSN=web-app-serve-placeholder
ENV REACT_APP_HCATPCHA_SITEKEY=web-app-serve-placeholder
ENV REACT_APP_GOOGLE_ANALYTICS_ID=web-app-serve-placeholder

RUN --mount=type=cache,id=pnpm,target=/pnpm/store WEB_APP_SERVE_ENABLED=true pnpm build

# ---------------------------------------------------------------------------

FROM ghcr.io/toggle-corp/web-app-serve:v0.1.2 AS web-app-serve

LABEL maintainer="IDMC"
LABEL org.opencontainers.image.source="github.com/idmc-labs/helix-client"

ENV APPLY_CONFIG__SOURCE_DIRECTORY=/code/build/
COPY --from=web-app-serve-build /code/build "$APPLY_CONFIG__SOURCE_DIRECTORY"

# Custom apply-config: this project uses the REACT_APP_ prefix (the base
# image's default script only substitutes APP_-prefixed variables)
COPY ./web-app-serve/apply-config.sh /web-app-serve/react-app-apply-config.sh
RUN chmod +x /web-app-serve/react-app-apply-config.sh
ENV APPLY_CONFIG__APPLY_CONFIG_PATH=/web-app-serve/react-app-apply-config.sh

# Default (overridable) configs. Substituted at startup like any other
# variable, so deployments need not set them but can still override.
ENV REACT_APP_MMP_ENDPOINT=https://media-monitoring.idmcdb.org
