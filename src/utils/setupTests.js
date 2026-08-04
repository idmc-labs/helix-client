// React 16 Enzyme adapter.
// Guarded with require()/try-catch so that pure-logic test suites can still run
// even when the enzyme/cheerio stack fails to load on the current Node version
// (modern cheerio uses `node:` imports that Jest 26 cannot resolve). Component
// tests that actually need enzyme should repair this bootstrap.
try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const Enzyme = require('enzyme');
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const Adapter = require('enzyme-adapter-react-16');
    // eslint-disable-next-line global-require, no-unused-vars
    require('./tempPolyfills');
    Enzyme.configure({ adapter: new Adapter() });
} catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Enzyme test setup skipped:', error.message);
}

// jest.mock('mapbox-gl', () => undefined);
