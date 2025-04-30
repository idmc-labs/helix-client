import { ValidateEnv as validateEnv } from '@julr/vite-plugin-validate-env';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import webfontDownload from 'vite-plugin-webfont-dl';
import reactSwc from '@vitejs/plugin-react-swc';
import { execSync } from 'child_process';
import { compression } from 'vite-plugin-compression2';
import svgr from 'vite-plugin-svgr';

import envConfig from './env';

/* Get commit hash */
const commitHash = execSync('git rev-parse --short HEAD').toString();

export default defineConfig((config) => {
    const { mode } = config;
    const isProd = mode === 'production';
    const env = loadEnv(mode, process.cwd(), '');

    return {
        define: {
            'import.meta.env.REACT_APP_COMMIT_HASH': JSON.stringify(commitHash),
            'import.meta.env.REACT_APP_VERSION': JSON.stringify(env.npm_package_version),
            'import.meta.env.REACT_APP_PACKAGE_NAME': JSON.stringify(env.npm_package_name),
            // NOTE: To fix 'global is not defined' issue after migration from yarn to pnpm
            // global: {},
        },
        build: {
            outDir: './build',
            sourcemap: isProd,
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    chunkFileNames: 'chunk-[name].[hash].js',
                    entryFileNames: 'entry-[name].[hash].js',
                    assetFileNames: 'asset-[name]-[hash].[ext]',
                    manualChunks: {
                        // 'markdown-related': ['react-markdown', 'remark-gfm'],
                    },
                },
            },
        },
        test: {
            globals: true,
            environment: 'jsdom',
            reporters: ['default', 'junit'],
            outputFile: 'test-results.xml',
            coverage: {
                reportsDirectory: './coverage',
                reporter: ['text', 'cobertura'],
            },
            // you might want to disable it, if you don't have tests that rely on CSS
            // since parsing CSS is slow
            css: true,
        },
        envPrefix: 'REACT_APP_',
        server: {
            port: 3001,
            strictPort: true,
        },
        css: {
            devSourcemap: isProd,
            modules: {
                scopeBehaviour: 'local',
                localsConvention: 'camelCaseOnly',
            },
        },
        plugins: [
            svgr(),
            reactSwc(),
            tsconfigPaths(),
            webfontDownload(),
            validateEnv(envConfig),
            isProd ? compression() : undefined,
        ],
    };
});
