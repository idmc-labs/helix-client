const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const config = require('./webpack.common.js')

const appBase = process.cwd();
const eslintFile = path.resolve(appBase, '.eslintrc-loader.js');
const nodeModulesSrc = path.resolve(appBase, 'node_modules/');
const appSrc = path.resolve(appBase, 'src/');

module.exports = {
    ...config,
    output: {
        ...config.output,
        chunkFilename: 'js/[name].js',
        filename: 'js/[name].js',
        pathinfo: false,
    },

    mode: 'development',

    devtool: 'eval-cheap-module-source-map',

    performance: {
        hints: 'warning',
    },

    devServer: {
        host: '0.0.0.0',
        port: 3080,
        overlay: true,
        watchOptions: {
            ignored: /node_modules/,
        },
        // Don't show warnings in browser console
        clientLogLevel: 'none',

        hot: true,
        liveReload: false,
    },

    module: {
        ...config.module,
        rules: [
            ...config.module.rules,
            {
                test: /\.(html)$/,
                use: [
                    require.resolve('html-loader'),
                ],
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                use: [
                    {
                        loader: require.resolve('file-loader'),
                        options: {
                            name: 'assets/[name].[ext]',
                        },
                    },
                ],
            },
            {
                test: /\.(js|jsx|ts|tsx)$/,
                include: appSrc,
                use: [
                    // require.resolve('cache-loader'),
                    {
                        loader: require.resolve('esbuild-loader'),
                        options: {
                            loader: 'tsx',
                            target: 'es6',
                            tsconfigRaw: require(path.resolve(appBase, 'tsconfig.json')),
                        },
                    },
                    {
                        loader: require.resolve('eslint-loader'),
                        options: {
                            // cache: true,
                            configFile: eslintFile,
                            failOnError: true,
                        },
                    },
                ],
            },
            {
                test: /\.(css|scss)$/,
                include: appSrc,
                use: [
                    require.resolve('style-loader'),
                    {
                        // NOTE: we may need to use postcss-modules instead of css-loader
                        loader: require.resolve('css-loader'),
                        options: {
                            importLoaders: 1,
                            modules: {
                                localIdentName: '[name]_[local]_[hash:base64]',
                            },
                            esModule: true,
                            localsConvention: 'camelCaseOnly',
                            sourceMap: true,
                        },
                    },
                    {
                        loader: require.resolve('postcss-loader'),
                        options: {
                            ident: 'postcss',
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: /\.(css|scss)$/,
                include: nodeModulesSrc,
                use: [
                    require.resolve('style-loader'),
                    require.resolve('css-loader'),
                ],
            },
        ],
    },
    plugins: [
        ...config.plugins,
        // NOTE: could try using react-hot-loader
        // https://github.com/gaearon/react-hot-loader
        new MiniCssExtractPlugin({
            filename: 'css/[name].css',
            chunkFilename: 'css/[id].css',
        }),
        new webpack.HotModuleReplacementPlugin(),
    ],
};
