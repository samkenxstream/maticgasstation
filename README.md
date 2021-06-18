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
SAFELOW=30
STANDARD=60
FAST=90
FASTEST=100
RPC=wss://<domain>
BUFFERSIZE=500
HOST=127.0.0.1
PORT=7000
```

- Install dependencies

```bash
make install
```

- Run service

```bash
make run
```

## Usage

Send HTTP GET request

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
  "blockTime": 2,
  "blockNumber": 15854458
}
```

## Interpretation

### Configuration

Field | Interpretation
--- | ---
SafeLow | Minimum gas price at which **X** % of last **N** tx(s) got accepted
Standard | -- do --
Fast | -- do --
Fastest | -- do --
RPC | Bor node's websocket endpoint URL
BufferSize | Last N tx(s) considered when recommending
Host | Run HTTP server on interface address
Port | Accept connections on port

### Response

Field | Interpretation
--- | ---
SafeLow | Lowest possible recommended gas price
Standard | Average gas price seen **( Recommended )**
Fast | Tx should be included in ~30 sec
Fastest | Targeted towards traders, super fast inclusion possibility
BlockTime | Observed delay between two recently mined consequtive blocks
BlockNumber | Latest considered block in recommendation

> Note: All gas prices in `Gwei`
