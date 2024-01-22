import React from 'react';
import {
    ApolloClient,
    ApolloProvider,
    InMemoryCache,
    ApolloLink as ApolloLinkFromClient,
    HttpLink,
} from '@apollo/client';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';
import { RetryLink } from 'apollo-link-retry';
import { RestLink } from 'apollo-link-rest';
import { createUploadLink } from 'apollo-upload-client';
import { isDefined } from '@togglecorp/fujs';

import '@togglecorp/toggle-ui/build/index.css';
import 'react-mde/lib/styles/css/react-mde-all.css';
import '../../../node_modules/mapbox-gl/dist/mapbox-gl.css';
import './styles.css';

import Multiplexer from './Multiplexer';

const errorLink = onError((all) => {
    const { graphQLErrors } = all;
    console.log(all);
    if (graphQLErrors) {
        const allErrors = graphQLErrors.map((error) => (
            error.message
        )).join('\n');

        // NOTE: we are overriding network errors if we have graphql errors
        // as network errors get more priority than graphql errors on apollo client
        if (all.networkError) {
            // eslint-disable-next-line no-param-reassign
            all.networkError.message = allErrors;
        }
    }
});

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT as string;

const client = new ApolloClient({
    link: ApolloLink.from([
        new RetryLink({
            attempts: {
                max: 5,
                retryIf: (error: { statusCode: number | undefined }) => (
                    isDefined(error.statusCode) && error.statusCode < 400
                ),
            },
        }),
        ApolloLink.split(
            (operation) => operation.getContext().hasUpload,
            createUploadLink({
                uri: GRAPHQL_ENDPOINT,
                credentials: 'include',
            }) as unknown as ApolloLink,
            ApolloLink.from([
                new RestLink({
                    uri: 'https://osmnames.idmcdb.org',
                }) as unknown as ApolloLink,
                errorLink as unknown as ApolloLink,
                new HttpLink({
                    uri: GRAPHQL_ENDPOINT,
                    credentials: 'include',
                }) as unknown as ApolloLink,
            ]),
        ),
    ]) as unknown as ApolloLinkFromClient,
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    // Getting notification list and notification count will be
                    // problematic because of missing id
                    notifications: {
                        merge: (existing, incoming) => {
                            if (!existing) {
                                return incoming;
                            }
                            return {
                                ...existing,
                                ...incoming,
                            };
                        },
                    },
                },
            },
        },
    }),
    assumeImmutableResults: true,
    defaultOptions: {
        query: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
        },
        watchQuery: {
            // NOTE: setting nextFetchPolicy to cache-and-network is risky
            fetchPolicy: 'network-only',
            nextFetchPolicy: 'cache-only',
            errorPolicy: 'all',
        },
    },
});

function App() {
    return (
        <ApolloProvider client={client}>
            <Multiplexer />
        </ApolloProvider>
    );
}
export default App;
