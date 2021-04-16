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
    },

    mode: 'production',

    devtool: 'source-map',

    optimization: {
        minimize: true,
        useExports: true,
        minimizer: [
            new ESBuildMinifyPlugin({
                target: 'esnext',
            }),
        ],
        splitChunks: {
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    // name: 'vendors',
                    // chunks: 'all',
                    name(module) {
                        // get the name. E.g. node_modules/packageName/not/this/part.js
                        // or node_modules/packageName
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

                        // npm package names are URL-safe, but some servers don't like @ symbols
                        return `npm.${packageName.replace('@', '')}`;
                    },
                },
            },
        },
        runtimeChunk: 'single',
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
                type: 'asset/resource',
            },
            {
                test: /\.(js|jsx|ts|tsx)$/,
                include: appSrc,
                use: [
                    {
                        loader: require.resolve('esbuild-loader'),
                        options: {
                            loader: 'tsx',
                            target: 'esnext',
                            tsconfigRaw: require(path.resolve(appBase, 'tsconfig.json')),
                            format: 'esm',
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
                                localIdentName: '[name]_[local]_[contenthash:base64]',
                                exportLocalsConvention: 'camelCaseOnly',
                            },
                            esModule: true,
                            sourceMap: true,
                        },
                    },
                    {
                        loader: require.resolve('postcss-loader'),
                        options: {
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
    ],
};
