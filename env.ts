import {
    defineConfig,
    overrideDefineForWebAppServe,
    Schema,
} from '@togglecorp/vite-plugin-validate-env';

const webAppServeEnabled = process.env.WEB_APP_SERVE_ENABLED?.toLowerCase() === 'true';
if (webAppServeEnabled) {
    // eslint-disable-next-line no-console
    console.warn('Building application for web-app-serve');
}
const overrideDefine = webAppServeEnabled
    ? overrideDefineForWebAppServe
    : undefined;

export default defineConfig({
    overrideDefine,
    validator: 'builtin',
    schema: {
        REACT_APP_ENV: Schema.string(),
        REACT_APP_GRAPHQL_ENDPOINT: Schema.string({ format: 'url', protocol: true, tld: false }),
        REACT_APP_GRAPHIQL_ENDPOINT: Schema.string.optional({ format: 'url', protocol: true, tld: false }),
        REACT_APP_SWAGGER_ENDPOINT: Schema.string.optional({ format: 'url', protocol: true, tld: false }),
        REACT_APP_HCATPCHA_SITEKEY: Schema.string(),
        REACT_APP_MMP_ENDPOINT: Schema.string.optional({ format: 'url', protocol: true, tld: false }),
        REACT_APP_SENTRY_DSN: Schema.string.optional(),
        REACT_APP_MAPBOX_ACCESS_TOKEN: Schema.string(),
        REACT_APP_GOOGLE_ANALYTICS_ID: Schema.string.optional(),
    },
});
