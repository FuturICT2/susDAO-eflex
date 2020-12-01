import web3_contract, json, random, time
from pprint import pp




class AutoOfferer(web3_contract.AsyncContract):
    def run(self):
        while True:
            now = int(time.time())
            receipt = self.mint_flex_offer_to(
                100, # power
                5, # duration
                now+910, # start
                now+920) # end
            logs = self.contract.events.flexOfferMinted().processReceipt(receipt)
            print("Created new flex offer with id", hex(logs[0]['args']['flexOfferId']))
            time.sleep(2)


if __name__ == "__main__":
    from config import config
    
    flex_manager_contract_info = {
        "abi": config.flex_offer_abi,
        "address": config.flex_offer_address,
        "http_provider_url": config.provider_url,
        "private_key": config.accounts[0]["private_key"]
    }

    ao = AutoOfferer(**flex_manager_contract_info)
    ao.run()
    #ao.start_all()