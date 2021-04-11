# Helix

React client for Helix

## Getting started

### Create .env file

```bash
touch .env
cat << 'EOF' > .env
REACT_APP_GRAPHQL_ENDPOINT=http://localhost:9000/graphql
GRAPHQL_CODEGEN_ENDPOINT=http://localhost:9000/graphql
REACT_APP_ENV=dev

# Use this variable if you want to run yarn generate from inside docker
# GRAPHQL_CODEGEN_ENDPOINT=http://172.17.0.1:9000/graphql
EOF
```

The `.env` file requires these variables to be set:

```bash
NODE_ENV= # (auto-set: development, production, test)
REACT_APP_GRAPHQL_ENDPOINT=your_graphql_endpoint # (required)
GRAPHQL_CODEGEN_ENDPOINT=your_graphql_endpoint # (required)
REACT_APP_ENV=your_env # (required: dev,nightly,alpha,beta,prod)
REACT_APP_SENTRY_DSN=your_sentry_dsn # (optional)
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token # (optional)
```

### Generate introspection schema and typings
```
docker-compose run --rm react sh
yarn install && yarn generate
```

### Run

```
# Run docker-container
docker-compose up
```

### Cloudformation Deployment

Replace
- {AWS_PROFILE} with required profile.
- {env} with deployment environment.
- {HostedZoneId} with required hosted zone id.

```bash
AWS_PROFILE={AWS_PROFILE} aws cloudformation deploy \
    --capabilities CAPABILITY_NAMED_IAM \
    --template-file aws/cloudformation.yml \
    --stack-name helix-{env}-client \
    --tags app=helix env={env} \
    --parameter-overrides Env={env} HostedZoneId={HostedZoneId}

# Show stack outputs (Values are required to setup CI/CD)
AWS_PROFILE={AWS_PROFILE} aws cloudformation describe-stacks \
    --stack-name helix-{env}-client \
    | jq -r '.Stacks[0].Outputs'
```
