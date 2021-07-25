# Helix 2.0

React client for Helix 2.0

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
GRAPHQL_CODEGEN_ENDPOINT=your_graphql_endpoint # (required)
REACT_APP_MMP_ENDPOINT=your_mmp_endpoint # (optional)
REACT_APP_HCATPCHA_SITEKEY=the captcha key #(optional)
```

### Generate introspection schema and typings
```
yarn install

# Set GRAPHQL_CODEGEN_ENDPOINT to the output of /sbin/ip route | awk '/default/ { print $3 }'
yarn generate
```

### Run

```
# Run docker-container and automatically install all depedencies
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
