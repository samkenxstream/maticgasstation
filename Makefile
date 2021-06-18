SHELL := /bin/bash

install:
	pushd mgs; npm i; popd

run:
	pushd mgs; node index.js; popd
