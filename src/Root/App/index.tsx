import React from 'react';
import { ApolloClient, ApolloProvider, InMemoryCache, ApolloLink as ApolloLinkFromClient } from '@apollo/client';
import { ApolloLink } from 'apollo-link';
import { RetryLink } from 'apollo-link-retry';
import { RestLink } from 'apollo-link-rest';
import { BatchHttpLink } from 'apollo-link-batch-http';
import { createUploadLink } from 'apollo-upload-client';
import { isDefined } from '@togglecorp/fujs';

import '@togglecorp/toggle-ui/build/index.css';
import 'react-mde/lib/styles/css/react-mde-all.css';
import '../../../node_modules/mapbox-gl/dist/mapbox-gl.css';
import './styles.css';

import Multiplexer from './Multiplexer';

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
                new BatchHttpLink({
                    uri: GRAPHQL_ENDPOINT,
                    credentials: 'include',
                }),
                /*
                createHttpLink({
                    uri: GRAPHQL_ENDPOINT,
                    credentials: 'include',
                }),
                */
            ]),
        ),
    ]) as unknown as ApolloLinkFromClient,
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
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
