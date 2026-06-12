#!/bin/sh

npx tsc
mv -vn ./dist/* ./
rm -rf dist

npm pack