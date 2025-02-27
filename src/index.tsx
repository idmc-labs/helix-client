import React from 'react';
import ReactDOM from 'react-dom';

import Root from './Root';

console.info('React version', React.version);

const rootElement = document.getElementById('helix-client-root');
if (rootElement) {
    ReactDOM.render(<Root />, rootElement);
} else {
    console.error('Root element was not found');
}
