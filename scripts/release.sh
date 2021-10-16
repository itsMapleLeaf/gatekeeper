#!/usr/bin/env bash
pnpm run docs &&
git add docs &&
git commit -m "docs" &&

pnpm run build &&
pnpm run test &&
pnpm run typecheck &&

release-it
