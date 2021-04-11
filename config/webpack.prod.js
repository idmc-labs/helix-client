const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { ESBuildMinifyPlugin } = require('esbuild-loader');
const CompressionPlugin = require('compression-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const config = require('./webpack.common.js')

const appBase = process.cwd();
const eslintFile = path.resolve(appBase, '.eslintrc-loader.js');
const nodeModulesSrc = path.resolve(appBase, 'node_modules/');
const appSrc = path.resolve(appBase, 'src/');

module.exports = {
    ...config,

    output: {
        ...config.output,
        chunkFilename: 'js/[name].[chunkhash].js',
        filename: 'js/[name].[contenthash].js',
    },

    mode: 'production',

    devtool: 'source-map',

    optimization: {
        minimize: true,
        minimizer: [
            new ESBuildMinifyPlugin({
                target: 'es6',
            }),
        ],
        splitChunks: {
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
        runtimeChunk: 'single',
        moduleIds: 'hashed',
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
                            name: 'assets/[name].[contenthash].[ext]',
                        },
                    },
                ],
            },
            {
                test: /\.(js|jsx|ts|tsx)$/,
                include: appSrc,
                use: [
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
                    MiniCssExtractPlugin.loader,
                    {
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
                    MiniCssExtractPlugin.loader,
                    require.resolve('css-loader'),
                ],
            },
        ],
    },

    plugins: [
        ...config.plugins,
        new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash].css',
            chunkFilename: 'css/[id].[contenthash].css',
        }),

        // Remove build folder anyway
        new CleanWebpackPlugin(),
        // Compress assets
        new CompressionPlugin(),
        // Generate service worker
        new WorkboxPlugin.GenerateSW({
            // these options encourage the ServiceWorkers to get in there fast
            // and not allow any straggling "old" SWs to hang around
            clientsClaim: true,
            skipWaiting: true,
            include: [/\.html$/, /\.js$/, /\.css$/],
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/assets/, /^\/admin/, /^\/api/],
            cleanupOutdatedCaches: true,
            runtimeCaching: [
                {
                    urlPattern: /assets/,
                    handler: 'CacheFirst',
                },
            ],
        }),

        new webpack.HashedModuleIdsPlugin(),
    ],
};
