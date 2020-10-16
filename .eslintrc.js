module.exports = {
    extends: [
        'airbnb',
        'plugin:postcss-modules/recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    env: {
        browser: true,
        jest: true,
    },
    plugins: [
        'react',
        'react-hooks',
        'import',
        'postcss-modules',
        '@typescript-eslint',
        'graphql',
    ],
    settings: {
        'postcss-modules': {
            // postcssConfigDir: 'cwd',
            // baseDir: 'cwd',
            camelCase: 'camelCaseOnly',
            // defaultScope: 'local',
            // include: /\.css$/,
            // exclude: /\/node_modules\//,
        },
        'import/resolver': {
            'babel-module': {
                root: ['.'],
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
                alias: {
                    '#components': './src/components',
                    '#config': './src/config',
                    '#resources': './src/resources',
                    '#utils': './src/utils',
                    '#views': './src/views',
                    '#types': './src/types',
                    '#hooks': './src/hooks',
                },
            },
        },
        react: {
            version: 'detect',
        },
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        ecmaFeatures: {
            jsx: true,
        },
        sourceType: 'module',
        allowImportExportEverywhere: true,
    },
    rules: {
        strict: 0,
        indent: ['error', 4, { SwitchCase: 1 }],
        'no-unused-vars': [1, { vars: 'all', args: 'after-used', ignoreRestSiblings: false }],
        'no-console': 0,

        'no-use-before-define': 0,
        '@typescript-eslint/no-use-before-define': 1,

        // note you must disable the base rule as it can report incorrect errors
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['error'],

        'react/jsx-indent': [2, 4],
        'react/jsx-indent-props': [2, 4],
        'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
        'react/prop-types': [1, { ignore: [], customValidators: [], skipUndeclared: false }],
        'react/forbid-prop-types': [1],
        'react/destructuring-assignment': [1, 'always', { ignoreClassFields: true }],
        'react/sort-comp': [1, {
            order: [
                'static-methods',
                'constructor',
                'lifecycle',
                'everything-else',
                'render',
            ],
        }],

        'jsx-a11y/anchor-is-valid': ['error', {
            components: ['Link'],
            specialLink: ['to'],
        }],

        'import/extensions': ['off', 'never'],
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],

        'postcss-modules/no-unused-class': 'warn',
        'postcss-modules/no-undef-class': 'warn',

        'prefer-destructuring': 'warn',
        'function-paren-newline': ['warn', 'consistent'],
        'object-curly-newline': [2, {
            ObjectExpression: { consistent: true },
            ObjectPattern: { consistent: true },
            ImportDeclaration: { consistent: true },
            ExportDeclaration: { consistent: true },
        }],

        'jsx-a11y/label-has-for': 'warn',

        '@typescript-eslint/no-empty-interface': 0,
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/explicit-module-boundary-types': 0,

        'react/no-unused-state': 'warn',
        'react/jsx-props-no-spreading': 'warn',
        'react/require-default-props': 0,
        'react/default-props-match-prop-types': ['warn', {
            allowRequiredDefaults: true,
        }],

        'graphql/template-strings': ['error', {
            env: 'apollo',
            // Import your schema JSON here
            schemaJson: require('./schema.json'),
        }],

        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
    },
};
