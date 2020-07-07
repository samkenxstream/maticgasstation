# maticgasstation

## intro

_**maticgasstation** - Friend of a Matic developer_

_Tool for getting gas price recommendations before sending transactions off to matic network_

## origin

This project is inspired by [gasstation-express-oracle](https://github.com/ethgasstation/gasstation-express-oracle). Updated to work with Matic Network.

## progress

~~**This is active WIP**~~

- Started adapting for matic network [03/07/2020]
- Completed writing, now works for Matic network [06/07/2020]
- More features to be added in near future

    - Multi-thearding support for faster performance _[ not implemented now due to race condition in threads ]_
    - Better memory management _[ introduce low footprint execution support for script ]_

## usage

- First thing first, simply clone this repo into host machine
- Prepare a config file i.e. below, this needs to be supplied while invoking script. This config file holds information related to what percentage of blocks accepted in certain mininum gas price. An example config file is supplied in this repo.

```json
{
    "safelow": 35,
    "standard": 60,
    "fast": 90
}
```
- **Make sure you've Python( >= 3.7.0 )**
- Now install all dependencies by running

```bash
$ python3 -m pip install -r requirements.txt
```
- Install `flit` - easy to use for building PyPI packages and also for local use.

```bash
$ python3 -m pip install -U flit
```
- `flit init` has already been done, which is why `pyproject.toml` is generated.
- Now run, before that make sure you've added `$HOME/.local/bin` to `$PATH`.

```bash
$ flit install -s
```
- Now `maticGS` will be available on your `$PATH`.
- Run using 

```bash
$ maticGS config.json ~/sinkForGasPrice.json ~/sinkForPredictionTable.json
```

- And that's it :wink:

