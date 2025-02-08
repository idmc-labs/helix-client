import React from 'react';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import {
    init,
    ErrorBoundary,
    reactRouterV5BrowserTracingIntegration,
    browserProfilingIntegration,
    browserTracingIntegration,
    replayIntegration,
    feedbackIntegration,
} from '@sentry/react';
import { setMapboxToken } from '@togglecorp/re-map';

import Error from '#views/Error';
import App from './App';

import styles from './styles.css';

const history = createBrowserHistory();

const mapboxToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
const appCommitHash = process.env.REACT_APP_COMMITHASH || 'UNKNOWN';
// const runtimeEnv = process.env.NODE_ENV;
const env = process.env.REACT_APP_ENV;
if (sentryDsn) {
    init({
        dsn: sentryDsn,
        environment: env,
        debug: env === 'dev',
        release: `helix@${appCommitHash}`,
        // sendDefaultPii: true,
        normalizeDepth: 5,
        integrations: [
            reactRouterV5BrowserTracingIntegration({ history }),
            // TODO: We should also set document response header to include
            // Document-Policy: js-profiling
            browserProfilingIntegration(),
            browserTracingIntegration(),
            replayIntegration(),
            feedbackIntegration({
                colorScheme: 'system',
            }),
        ],
        tracesSampleRate: 1.0,
        // FIXME: set this to the domains we have
        tracePropagationTargets: ['localhost', /^\//],
        replaysSessionSampleRate: 1.0,
        profilesSampleRate: 1.0,
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
