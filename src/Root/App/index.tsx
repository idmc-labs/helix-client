import React from 'react';
import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';

import '@togglecorp/toggle-ui/build/index.css';
import './styles.css';

import Multiplexer from './Multiplexer';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT as string;

// FIXME: need to change credentials this to same-site on production
const link = createHttpLink({
    uri: GRAPHQL_ENDPOINT,
    credentials: 'include',
});

const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'network-only',
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
