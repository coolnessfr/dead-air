#!/bin/sh
set -e
cd "$(dirname "$0")"
mkdir -p dist
cat src/game.js src/part2.js src/part3.js src/part4.js src/part5.js src/part6.js > dist/all.js
npx esbuild dist/all.js --bundle --minify --format=iife --target=es2020 --outfile=dist/bundle.js --log-level=warning
python3 - <<'P'
t=open('template.html').read(); b=open('dist/bundle.js').read().replace('</script','<\\/script')
open('index.html','w').write(t.replace('/*__BUNDLE__*/', b))
P
ls -la index.html
