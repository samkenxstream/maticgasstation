# maticgasstation

Gas Price Recommender for Matic Network

## Deployment

- Make sure you've `npm`, `nodejs` & `make` installed
- Prepare `.env` file & paste following content into it. You may want to [check](#configuration)

```bash
pushd mgs
touch .env
```

> Note: For `RPC` field, use websocket endpoint of Bor Node

```
v1SAFELOW=60
v1STANDARD=75
v1FAST=90
v1FASTEST=100
v2SAFELOW=250
v2STANDARD=150
v2FAST=50
v2FASTEST=25
RPC=https://<domain>
HOST=0.0.0.0
PORT=7000
```

- Install dependencies

```bash
popd
make install
```

- Run service

```bash
make run
```

---

### Dockerised Setup

Assuming you've docker daemon up & running,

- Build docker image

```bash
# all commands executed at root of project

make build_docker
```

- Create `.env` file at root of project
- Run docker container

```bash
# exposes port 7000 on HOST,
# while expecting PORT field
# was untouched in .env

make run_docker
```

- Check docker container running

```bash
docker ps
```

- Check log

```bash
docker logs matic_gas_station -f # while following
```

- Stop container

```bash
docker stop matic_gas_station
```

- Restart container

```bash
docker restart matic_gas_station
```

- Remove container

```bash
docker rm matic_gas_station
```

- Remove image

```bash
docker rmi -f matic_gas_station
```

> Note: Log rotation is enabled, max log file size 8MB, max log file count 4. For changing this see `Makefile`.

## Usage

Send HTTP GET request

To get recommendations using v1

```bash
curl -s localhost:7000/v1 | jq
```

To get recommendations using v2

```bash
curl -s localhost:7000/v2 | jq
```

The following way to request is deprecated. Please change older code to request using the above versioned endpoints (Changed to v1)

```bash
curl -s localhost:7000 | jq
```

You'll receive

```json
{
  "safeLow": 2,
  "standard": 3.020000001,
  "fast": 5,
  "fastest": 3870.208681652,
  "sinceLastBlock": 2, // in seconds
  "lastBlockNumber": 15854458
}
```

## Interpretation

### Configuration

| Field      | Interpretation                                                                             |
| ---------- | ------------------------------------------------------------------------------------------ |
| v1SafeLow  | Minimum gas price at which **X** % of last **N** tx(s) got accepted                        |
| v1Standard | -- do --                                                                                   |
| v1Fast     | -- do --                                                                                   |
| v1Fastest  | -- do --                                                                                   |
| v2SafeLow  | Gas price of **X**th transaction currently in the txPool in descending order of gas Prices |
| v2Standard | -- do --                                                                                   |
| v2Fast     | -- do --                                                                                   |
| v2Fastest  | -- do --                                                                                   |
| RPC        | Bor node's websocket endpoint URL                                                          |
| Host       | Run HTTP server on interface address                                                       |
| Port       | Accept connections on port                                                                 |

### Response

| Field           | Interpretation                                               |
| --------------- | ------------------------------------------------------------ |
| SafeLow         | Lowest possible recommended gas price                        |
| Standard        | Average gas price seen **( Recommended )**                   |
| Fast            | Tx should be included in ~30 sec                             |
| Fastest         | Targeted towards traders, super fast inclusion possibility   |
| SinceLastBlock  | Observed delay between two recently mined consequtive blocks |
| LastBlockNumber | Latest considered block in recommendation                    |

> Note: All gas prices in `Gwei`
