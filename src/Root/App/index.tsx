import React from 'react';
import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';
import { ApolloLink } from 'apollo-link';
import { RetryLink } from 'apollo-link-retry';
// import { BatchHttpLink } from 'apollo-link-batch-http';
import { createUploadLink } from 'apollo-upload-client';
import { isList, isObject, isDefined } from '@togglecorp/fujs';

import '@togglecorp/toggle-ui/build/index.css';
import './styles.css';

import Multiplexer from './Multiplexer';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT as string;

function removeNull(data: unknown): any {
    if (data === null || data === undefined) {
        return undefined;
    }
    if (isList(data)) {
        return data.map(removeNull).filter(isDefined);
    }
    if (isObject(data)) {
        let newData = {};
        Object.keys(data).forEach((k) => {
            const key = k as keyof typeof data;
            const val = data[key];
            const newEntry = removeNull(val);
            if (newEntry) {
                newData = {
                    ...newData,
                    [key]: newEntry,
                };
            }
        });
        return newData;
    }
    return data;
}

// FIXME: does this have problem on automatic cache update
const NoNullLink = new ApolloLink((operation, forward) => (
    forward(operation).map((response) => {
        const newRes = removeNull(response);
        return newRes;
    })
));

const client = new ApolloClient({
    link: ApolloLink.from([
        NoNullLink,
        new RetryLink(),
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
