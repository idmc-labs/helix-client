import React from 'react';
import { Router, matchPath } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { init, ErrorBoundary, reactRouterV5Instrumentation } from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { setMapboxToken } from '@togglecorp/re-map';

import routeSettings, { lostRoute } from '#config/routes';
import Error from '#views/Error';
import App from './App';

import styles from './styles.css';

const history = createBrowserHistory();

const mapboxToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
const appCommitHash = process.env.REACT_APP_COMMITHASH || 'UNKNOWN';
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
                    [...Object.entries(routeSettings), lostRoute],
                    matchPath,
                ),
            }),
        ],
    });
}

if (mapboxToken) {
    setMapboxToken(mapboxToken);
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
