const esbuild = require('esbuild');
const path = require('path');

const watch = process.argv.includes('--watch');

const baseConfig = {
    bundle: true,
    platform: 'node',
    outdir: 'dist',
    sourcemap: true,
    external: ['vscode']
};

const watchConfig = {
    onRebuild(err) {
        if (err) console.error('[watch] build failed:', err.message);
        else console.log('[watch] build finished');
    }
};

async function build() {
    try {
        if (watch) {
            console.log('[watch] build started');
            await esbuild.build({
                ...baseConfig,
                entryPoints: [path.join(__dirname, 'src/extension.ts')],
                watch: watchConfig
            });
        } else {
            console.log('Building...');
            await esbuild.build({
                ...baseConfig,
                entryPoints: [path.join(__dirname, 'src/extension.ts')]
            });
            console.log('Build complete.');
        }
    } catch (e) {
        console.error('Build failed:', e);
        process.exit(1);
    }
}

build();