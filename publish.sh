#!/bin/bash

rm -rf ./dist

tsc --project tsconfig.json 2> /dev/null

if [ $? -eq 0 ]
then
  echo "Compilation OK, publishing"
  cp README.md ./dist/README.md
  cp package.json ./dist/package.json
else
  echo "Compilation failed" >&2
fi
