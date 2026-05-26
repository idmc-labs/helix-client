import React, { useEffect } from 'react';
import { Router, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
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
import mapboxgl from 'mapbox-gl';

import Error from '#views/Error';
import App from './App';

import styles from './styles.module.css';

const history = createBrowserHistory();

const mapboxToken = import.meta.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const sentryDsn = import.meta.env.REACT_APP_SENTRY_DSN;
const appCommitHash = import.meta.env.REACT_APP_COMMITHASH;
// const runtimeEnv = import.meta.env.NODE_ENV;
const env = import.meta.env.REACT_APP_ENV;
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
    mapboxgl.accessToken = mapboxToken;
}
const AnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search });
    }, [location]);

    return null;
};

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
                <AnalyticsTracker />
                <App {...props} />
            </Router>
        </ErrorBoundary>
    );
}

export default Root;
