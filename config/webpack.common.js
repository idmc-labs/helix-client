const ResourceHintWebpackPlugin = require('resource-hints-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const { ESBuildMinifyPlugin } = require('esbuild-loader');
const { config } = require('dotenv');

const dotenv = config({
    path: '.env',
});

const gitRevisionPlugin = new GitRevisionPlugin();

const appBase = process.cwd();
const eslintFile = path.resolve(appBase, '.eslintrc-loader.js');
const nodeModulesSrc = path.resolve(appBase, 'node_modules/');
const appSrc = path.resolve(appBase, 'src/');
const appDist = path.resolve(appBase, 'build/');
const appIndexJs = path.resolve(appBase, 'src/index.tsx');
const appIndexHtml = path.resolve(appBase, 'public/index.html');
const appFavicon = path.resolve(appBase, 'public/favicon.ico');
const appFaviconImage = path.resolve(appBase, 'public/favicon.png');

function prepareEnv(env) {
    const NODE_ENV = env.NODE_ENV ? env.NODE_ENV : 'development';

    const reduceFn = (acc, key) => {
        acc[key] = JSON.stringify(process.env[key]);
        return acc;
    };

    const initialState = { NODE_ENV: JSON.stringify(NODE_ENV) };

    const ENV_VARS = Object.keys(process.env)
        .filter(v => v.startsWith('REACT_APP_'))
        .reduce(reduceFn, initialState);
    return ENV_VARS;
};

const ENV_VARS = prepareEnv({
    ...dotenv.parsed,
    REACT_APP_VERSION: gitRevisionPlugin.version(),
    REACT_APP_COMMITHASH: gitRevisionPlugin.commithash(),
    REACT_APP_BRANCH: gitRevisionPlugin.branch(),
});

module.exports = {
    entry: appIndexJs,

    output: {
        path: appDist,
        publicPath: '/',
        sourceMapFilename: 'sourcemaps/[file].map',
    },

    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        symlinks: false,
        alias: {
            "#generated": path.resolve(appBase, "generated/"),
            "#components": path.resolve(appBase, "src/components/"),
            "#config": path.resolve(appBase, "src/config/"),
            "#resources": path.resolve(appBase, "src/resources/"),
            "#views": path.resolve(appBase, "src/views/"),
            "#types": path.resolve(appBase, "src/types"),
            "#utils": path.resolve(appBase, "src/utils"),
            "#hooks": path.resolve(appBase, "src/hooks"),
        },
    },

    node: {
        fs: 'empty',
    },

    module: {
        rules: [],
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env': ENV_VARS,
        }),
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            failOnError: false,
            allowAsyncCycles: false,
            cwd: appBase,
        }),
        new StyleLintPlugin({
            files: ['**/*.css'],
            context: appSrc,
        }),
        new HtmlWebpackPlugin({
            template: appIndexHtml,
            filename: './index.html',
            title: 'Helix',
            favicon: path.resolve(appFavicon),
            chunksSortMode: 'auto',
        }),
        new WebpackPwaManifest({
            name: 'helix-client',
            short_name: 'Helix',
            description: 'React client for Helix',
            background_color: '#f0f0f0',
            orientation: 'portrait',
            // theme_color: '#303f9f',
            display: 'standalone',
            start_url: '/',
            scope: '/',
            icons: [
                {
                    src: path.resolve(appFaviconImage),
                    sizes: [96, 128, 192, 256, 384, 512],
                    destination: path.join('assets', 'icons'),
                },
            ],
        }),
        new ResourceHintWebpackPlugin(),
    ],
};
