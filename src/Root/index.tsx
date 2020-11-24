import React from 'react';
import { Router, matchPath } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { init, ErrorBoundary, reactRouterV5Instrumentation } from '@sentry/react';
import { Integrations } from '@sentry/tracing';

import routeSettings from './App/Multiplexer/route';
import App from './App';
import Error from '../views/Error';

import styles from './styles.css';

const history = createBrowserHistory();

const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
const appCommitHash = process.env.REACT_APP_COMMITHASH;
const runtimeEnv = process.env.NODE_ENV;
const env = process.env.REACT_APP_ENV;
if (sentryDsn && runtimeEnv === 'production') {
    init({
        dsn: sentryDsn,
        release: `helix@${appCommitHash}`,
        environment: env,
        // sendDefaultPii: true,
        normalizeDepth: 5,
        integrations: [
            new Integrations.BrowserTracing({
                routingInstrumentation: reactRouterV5Instrumentation(
                    history,
                    Object.entries(routeSettings),
                    matchPath,
                ),
            }),
        ],
    });
}

// TODO: upload sourcemaps
// TODO: track performance monitoring

interface Props {
}

function Root(props: Props) {
    return (
        <ErrorBoundary
            fallback={<Error className={styles.error} />}
            showDialog
        >
            <Router history={history}>
                <App {...props} />
            </Router>
        </ErrorBoundary>
    );
}

export default Root;
