import json


class Config:
    def __init__(self):
        with open("../config/GanacheNetwork.json") as f:
            network_data = json.load(f)

        with open("../config/keys.json") as f:
            key_data = json.load(f)


        with open("../config/FlexOffer.json") as f:
            flexoffer_data = json.load(f)

        networks = flexoffer_data["networks"]
        network_id = network_data["network_id"]
        if networks == {}:
            raise Exception("ABI Config files don't contain deployment info; did you deploy the contracts?")
        
        if network_id not in networks:
            new_netid = list(networks.keys())[0]
            print(f"Network {network_id} not found in abi file, using first available network {new_netid}")
            network_id = new_netid
        
        acc_addr = next(iter(key_data["addresses"]))
        acc_priv_key = key_data["private_keys"][acc_addr]
        self.account = {
            "address": acc_addr,
            "private_key": "0x" + acc_priv_key
        }

        self.accounts = [{"address": addr, "private_key": key} for addr, key in key_data["private_keys"].items()]
        
        self.flex_offer_abi = flexoffer_data["abi"]
        self.network = network_data
        self.provider_url = f"http://{self.network['host']}:{self.network['port']}/"
        self.flex_offer_address = networks[network_id]["address"]


config = Config()