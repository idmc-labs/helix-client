import React from 'react';
import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';
import { ApolloLink } from 'apollo-link';
import { RetryLink } from 'apollo-link-retry';
import { RestLink } from 'apollo-link-rest';
// import { BatchHttpLink } from 'apollo-link-batch-http';
import { createUploadLink } from 'apollo-upload-client';

import '@togglecorp/toggle-ui/build/index.css';
import '../../../node_modules/mapbox-gl/dist/mapbox-gl.css';
import './styles.css';

import Multiplexer from './Multiplexer';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT as string;

const client = new ApolloClient({
    link: ApolloLink.from([
        new RetryLink(),
        new RestLink({
            uri: 'https://osmnames.idmcdb.org',
        }),
        ApolloLink.split(
            (operation) => operation.getContext().hasUpload,
            createUploadLink({
                uri: GRAPHQL_ENDPOINT,
                credentials: 'include',
            }),
            createHttpLink({
                uri: GRAPHQL_ENDPOINT,
                credentials: 'include',
            }),
            /*
            new BatchHttpLink({
                uri: GRAPHQL_ENDPOINT,
                credentials: 'include',
            }),
            */
        ),
    ]),
    cache: new InMemoryCache(),
    assumeImmutableResults: true,
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'cache-and-network',
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
