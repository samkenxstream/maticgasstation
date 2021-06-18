SHELL := /bin/bash

install:
	pushd mgs; npm i; popd

run:
	pushd mgs; node index.js; popd

build_docker:
	docker build -t matic_gas_station .

run_docker:
	docker run --name matic_gas_station --env-file .env -p 7000:7000 -d --restart always --log-opt max-size=8m --log-opt max-file=4 matic_gas_station
