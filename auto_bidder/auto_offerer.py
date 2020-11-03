import web3_contract, json, random, time




class AutoOfferer(web3_contract.AsyncContract):
    def run(self):
        while True:
            new_offer_nonce = random.randint(500000, 1000000)
            self.createFlexOffer(new_offer_nonce)
            print(f"Created offer with nonce {new_offer_nonce}")
            time.sleep(5)



if __name__ == "__main__":
    PROVIDER_URL = "http://localhost:7545"
    ABI_PATH = "../config/FlexSimAbi.json"
    DEPLOY_PATH = "../config/FlexSimDeploy.json"

    with open(ABI_PATH) as f:
        abi = json.load(f)["abi"]

    with open(DEPLOY_PATH) as f:
        address = json.load(f)["address"]
    
    flex_manager_contract_info = {
        "abi": abi,
        "address": address,
        "http_provider_url": PROVIDER_URL
    }

    ao = AutoOfferer(**flex_manager_contract_info)
    ao.run()