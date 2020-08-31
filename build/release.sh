#!/bin/bash
set -e

SEMVER=$1

git checkout dev
git pull
npm version $SEMVER -m 'Release %s'
git push
git checkout release
git merge dev
git push --follow-tags
git checkout dev
