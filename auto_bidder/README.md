# Autobidder

Creates multiple "autobidders" that randomly generate a maximum price for each FlexOffer put onto the market, and then incrementally offer money for these offers until their max price was reached.


```
usage: auto_bidder.py [-h] [-n [n]] [-url [url]] [-log [level]]

Spawns AutoBidders that automatically bid for flex-offers on the e-flex contract.

optional arguments:
  -h, --help    show this help message and exit
  -n [n]        total amount of bidders to spawn
  -url [url]    http url to eth provider
  -log [level]  logging level
```

Without any arguments, 5 bidders are spawned, and the url is taken from `config.py`.

It takes the **second** key from keys taken by `config.py`.



# config.py

Prepares global configuration located in `../config` for use, including:

* reads `keys.json`, exposes addresses and private_keys
* reads `GanacheNetwork.json`, exposes as `provider_url`
* reads `FlexOffer.json`, exposes as `flex_offer_abi` and `flex_offer_address`, based on the network defined in `GanacheNetwork.json`


# auto_offerer.py

Generates a new random offer every 2 seconds, based on config provided by `config.py`. Takes the **first** key exposed by `config.py`.


# web3_contract.py

A incomplete abstraction of web3py. 