# Helix 2.0

## Table of Contents

- [Helix 2.0](#helix-20)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Main Features](#main-features)
  - [Repository Structure](#repository-structure)
  - [Architecture](#architecture)
  - [Key Dependencies](#key-dependencies)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Environment Setup](#environment-setup)
    - [Installation](#installation)
  - [Development](#development)
  - [Testing](#testing)
  - [Deployment](#deployment)
    - [Build for Production](#build-for-production)
    - [AWS CloudFormation Deployment](#aws-cloudformation-deployment)
  - [API Documentation](#api-documentation)
    - [GraphQL Schema](#graphql-schema)
  - [Contributing](#contributing)
    - [Code Quality Guidelines](#code-quality-guidelines)
  - [Troubleshooting](#troubleshooting)
  - [Performance and Scaling](#performance-and-scaling)
  - [License](#license)

## Project Overview

Helix 2.0 is a React-based web application designed to provide a user-friendly
interface for interacting with a backend service via GraphQL. The project
emphasizes modularity, reusability, and maintainability, leveraging modern
JavaScript practices and TypeScript for enhanced type safety.

## Main Features
- **React-based UI**: Utilizes React for building dynamic user interfaces.
- **GraphQL Integration**: Efficient data retrieval and manipulation through GraphQL.
- **TypeScript**: Enhances type safety and developer productivity.
- **Environment Configuration**: Flexible configuration across different environments.
- **Containerization**: Docker integration for consistent development and deployment.
- **CloudFormation Deployment**: AWS CloudFormation for infrastructure as code (IaC).
- **Error Tracking**: Integrated with Sentry for monitoring errors.
- **Code Generation**: GraphQL Code Generator for TypeScript types based on the GraphQL schema.

## Repository Structure
- **Root Level**: Configuration files
- **`config/`**: Environment and webpack configurations
- **`src/`**: Main source code
  - `components/`: Reusable UI components
  - `hooks/`: Custom React hooks
  - `views/`: Application pages/views
  - `config/`: Routing and other settings
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions
- **`public/`**: Static assets
- **`.github/`**: CI/CD workflows
- **`aws/`**: CloudFormation templates

## Architecture
- **Component-Based Architecture**: Promotes reusability and separation of concerns.
- **Custom Hooks**: Encapsulate logic for state management and side effects.
- **GraphQL for Data Management**: Allows efficient data retrieval and manipulation.
- **Environment-Specific Configuration**: Flexible deployment strategies using environment variables.

## Key Dependencies
- React
- GraphQL
- TypeScript
- Docker
- AWS CloudFormation

## Getting Started

### Prerequisites
- Node.js
- Pnpm
- Docker (optional)

### Environment Setup
1. Create a `.env` file in the root directory with the following content:
   ```
   REACT_APP_GRAPHQL_ENDPOINT=http://localhost:9000/graphql
   REACT_APP_ENV=dev
   GRAPHQL_CODEGEN_ENDPOINT=your_graphql_endpoint
   REACT_APP_MMP_ENDPOINT=your_mmp_endpoint (optional)
   REACT_APP_SENTRY_DSN=your_sentry_dsn (optional)
   REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token (optional)
   REACT_APP_HCATPCHA_SITEKEY=the_captcha_key (optional)
   ```

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd helix-client
   ```
2. Install dependencies:
   ```
   pnpm install
   ```
3. Generate GraphQL schema and typings:
   ```
   pnpm generate
   ```

## Development
- Start the development server:
  ```
  pnpm start
  ```
- Or use Docker:
  ```
  docker-compose up
  ```

## Testing
Run tests using:
```
pnpm test
```

### Generate introspection schema and typings
```
pnpm install

# Set GRAPHQL_CODEGEN_ENDPOINT to the output of /sbin/ip route | awk '/default/ { print $3 }'
pnpm generate
```

## Deployment

### Build for Production
```
pnpm build
```

### AWS CloudFormation Deployment
1. Replace placeholders in the following command:
   ```bash
   AWS_PROFILE={AWS_PROFILE} aws cloudformation deploy \
       --capabilities CAPABILITY_NAMED_IAM \
       --template-file aws/cloudformation.yml \
       --stack-name helix-{env}-client \
       --tags app=helix env={env} \
       --parameter-overrides Env={env} HostedZoneId={HostedZoneId}
   ```
2. View stack outputs:
   ```bash
   AWS_PROFILE={AWS_PROFILE} aws cloudformation describe-stacks \
       --stack-name helix-{env}-client \
       | jq -r '.Stacks[0].Outputs'
   ```

## API Documentation

### GraphQL Schema
The `schema.graphql` file defines the data structure, including:
- `OsmNames`: Collection of OSM names with pagination and results.
- `OsmName`: Individual OSM entries with attributes like name, lat, lon, and country.
- `Query`: Defines lookup, globalLookup, and reverseLookup operations.

## Contributing
1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Submit a pull request with a description of your changes

### Code Quality Guidelines
- Use ESLint for consistent formatting
- Write unit tests critical components
- Document components with TypeScript interfaces
- Optimize performance using React.memo, useCallback and useMemo where necessary
- Ensure accessibility by using ARIA roles

## Troubleshooting
- **Module not found**: Ensure all dependencies are installed and paths are correct
- **GraphQL query failed**: Check the GraphQL server status and query syntax

## Performance and Scaling
- The application uses `ReactDOM.unstable_createRoot` for concurrent mode rendering
- Apollo Client is used for optimized data fetching

## License
This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for details.

---

For more detailed information or specific inquiries, please refer to the project documentation or contact the development team.
