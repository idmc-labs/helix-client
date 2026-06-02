import { defineConfig, Schema } from '@julr/vite-plugin-validate-env';

export default defineConfig({
    REACT_APP_ENV: Schema.string(),
    REACT_APP_GRAPHQL_ENDPOINT: Schema.string({ format: 'url', protocol: true, tld: false }),
    REACT_APP_GRAPHIQL_ENDPOINT: Schema.string.optional({ format: 'url', protocol: true, tld: false }),
    REACT_APP_SWAGGER_ENDPOINT: Schema.string.optional({ format: 'url', protocol: true, tld: false }),
    REACT_APP_HCATPCHA_SITEKEY: Schema.string(),
    REACT_APP_MMP_ENDPOINT: Schema.string.optional({ format: 'url', protocol: true, tld: false }),
    REACT_APP_SENTRY_DSN: Schema.string.optional(),
    REACT_APP_MAPBOX_ACCESS_TOKEN: Schema.string(),
    REACT_APP_GOOGLE_ANALYTICS_ID: Schema.string.optional(),
});
