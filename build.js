const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const distDir = path.join(__dirname, 'dist');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function copyStaticFiles() {
  // Copy manifest
  fs.copyFileSync(
    path.join(__dirname, 'manifest.json'),
    path.join(distDir, 'manifest.json')
  );

  // Copy icons
  copyRecursive(
    path.join(__dirname, 'icons'),
    path.join(distDir, 'icons')
  );

  // Copy side panel files
  copyRecursive(
    path.join(__dirname, 'sidepanel'),
    path.join(distDir, 'sidepanel')
  );

  // Copy background service worker
  copyRecursive(
    path.join(__dirname, 'background'),
    path.join(distDir, 'background')
  );

  console.log('Static files copied to dist/');
}

async function build() {
  // Ensure dist directory
  fs.mkdirSync(distDir, { recursive: true });

  // Bundle content script
  const ctx = await esbuild.context({
    entryPoints: ['content/content-main.js'],
    bundle: true,
    outfile: 'dist/content/content.js',
    format: 'iife',
    target: 'chrome110',
    sourcemap: false,
    minify: false,
    plugins: [{
      name: 'copy-static',
      setup(build) {
        build.onEnd(() => {
          copyStaticFiles();
        });
      }
    }]
  });

  if (isWatch) {
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Build complete!');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
