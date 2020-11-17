import web3_contract, json, auto_bidder

if __name__ == "__main__":

    # Configuration
    PROVIDER_URL = "http://localhost:7545"
    ABI_PATH = "../config/FlexSimAbi.json"
    DEPLOY_PATH = "../config/FlexSimDeploy.json"

    NUM_BIDDERS = 5
    BIDDER_CONFIG = {
        "bidding_target_range": (20, 200),
        "first_bid_range": (10, 20),
        "bid_increase_range": (10, 30),
        "logging_level": logging.INFO,
        "logging_handler": logging.StreamHandler()
    }

    # Execution


    with open(ABI_PATH) as f:
        abi = json.load(f)["abi"]

    with open(DEPLOY_PATH) as f:
        address = json.load(f)["address"]
    
    flex_manager_contract_info = {
        "abi": abi,
        "address": address,
        "http_provider_url": PROVIDER_URL
    }

    bidders = [auto_bidder.AutoBidder({}, **flex_manager_contract_info) for i in range(5)]
    web3_contract.start_all()