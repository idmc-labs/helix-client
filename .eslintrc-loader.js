const eslintrc = require('./.eslintrc.js');

var eslintrcLoader = {
    ...eslintrc,
    extends: [
        ...eslintrc.extends,
        'plugin:postcss-modules/recommended',
    ],
    plugins: [
        ...eslintrc.plugins,
        'postcss-modules',
    ],
    settings: {
        ...eslintrc.settings,
        'postcss-modules': {
            // postcssConfigDir: 'cwd',
            // baseDir: 'cwd',
            camelCase: 'camelCaseOnly',
            // defaultScope: 'local',
            // include: /\.css$/,
            // exclude: /\/node_modules\//,
        },
    },
    rules: {
        ...eslintrc.rules,

        'postcss-modules/no-unused-class': 'warn',
        'postcss-modules/no-undef-class': 'warn',
    },
};

module.exports = eslintrcLoader;
