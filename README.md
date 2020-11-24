# Helix

React client for Helix

## Getting started

### Create .env file

```bash
echo "REACT_APP_GRAPHQL_ENDPOINT=http://localhost:9000/graphql" > .env
echo "REACT_APP_ENV=dev" > .env
```

The .env file requires these variables to be set:

```bash
NODE_ENV= # (auto-set: development, production, test)
REACT_APP_GRAPHQL_ENDPOINT=your_graphql_endpoint # (required)
REACT_APP_ENV=your_env # (required: dev,nightly,alpha,beta,prod)
REACT_APP_SENTRY_DSN=your_sentry_dsn # (optional)
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token # (optional)
```

### Generate introspection schema and typings
```
docker-compose run --rm react sh -c "yarn install && yarn generate"
```

### Run

```
# Run docker-container and automatically install all depedencies
docker-compose up
```
