import React from 'react';
import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';

import Multiplexer from './Multiplexer';

import '@togglecorp/toggle-ui/build/index.css';
import './styles.css';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT as string;

// FIXME: need to change credentials this to same-site on production
const link = createHttpLink({
    uri: GRAPHQL_ENDPOINT,
    credentials: 'include',
});

const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
});

function App() {
    return (
        <ApolloProvider client={client}>
            <Multiplexer />
        </ApolloProvider>
    );
}
export default App;
