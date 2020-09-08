# Helix

React client for Helix

## Getting started

### Create .env file

```bash
echo "REACT_APP_GRAPHQL_ENDPOINT=http://localhost:9000/graphql" > .env
```

### Clone Server
```bash
# clone helix server into clients directory
git clone git@github.com:idmc-labs/helix-server.git ./server
```

### Run

```
# Run docker-container and automatically install all depedencies
docker-compose up
```

### Get introspection schema

```
# Gets schema from graphql endpoint and saves to schema.json
yarn get-schema
```
