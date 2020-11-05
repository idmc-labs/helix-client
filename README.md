# Helix

React client for Helix

## Getting started

### Create .env file

```bash
echo "REACT_APP_GRAPHQL_ENDPOINT=http://localhost:9000/graphql" > .env
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
