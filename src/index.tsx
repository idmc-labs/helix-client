import React from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga4';

import Root from './Root';

console.info('React version', React.version);

const TRACKING_ID = import.meta.env.REACT_APP_GOOGLE_ANALYTICS_ID;

if (TRACKING_ID) {
    ReactGA.initialize(TRACKING_ID, {
        gaOptions: {
            debug_mode: true, // NOTE: Enabling this to show hits in GA4 DebugView
        },
    });
}

const rootElement = document.getElementById('helix-client-root');
if (rootElement) {
    ReactDOM.render(<Root />, rootElement);
} else {
    console.error('Root element was not found');
}
