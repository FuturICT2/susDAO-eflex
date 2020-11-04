
import web3_contract, asyncio, random, logging, pprint



class AutoBidder(web3_contract.AsyncContract):
    def __init__(self, config, **kwargs):
        super().__init__(**kwargs)

        self.config = {
            "bidding_target_range": (20, 200),
            "first_bid_range": (10, 20),
            "bid_increase_range": (10, 30),
            "logging_level": logging.INFO,
            "logging_handler": logging.StreamHandler(),

            **config
        }
        self.bidding_bounds = {} # {offer_nonce: max_bid_amount}
        self.last_bids = {} # {offer_nonce: last_bid_amount} used to avoid countering already countered offers

        self.nonce = random.randint(0, 1000000)
        
        # Logger setup
        self.logger = logging.getLogger(f"AutoBidder[0x{self.nonce:0>5x}]")
        handler = self.config["logging_handler"]
        self.logger.setLevel(self.config["logging_level"])
        formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s", "%H:%M:%S")
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)


        self.logger.info("Contract connection established.")
    
    def get_bid_bound(self, offer_nonce):
        """
            Returns a determined bound for offer offer_nonce;
            creates one if not determined yet.
        """
        return self.bidding_bounds.setdefault(
            offer_nonce,
            random.randint(*self.config["bidding_target_range"])
        )
    
    def get_last_bid(self, offer_nonce):
        return self.last_bids.get(offer_nonce, 0)
    
    def set_last_bid(self, offer_nonce, bid_amount):
        self.last_bids[offer_nonce] = max(self.get_last_bid(offer_nonce), bid_amount)
    

    async def on_offerCreated(self, offerNonce):
        """ Makes an initial bid. Expected to be called once er offer. """
        first_bid = min(random.randint(*self.config["first_bid_range"]),
                        self.get_bid_bound(offerNonce))
        self.set_last_bid(offerNonce, first_bid)
        self.bidForFlexOffer(offerNonce, first_bid, self.nonce)
        
        self.logger.info(f"Created first bid for {offerNonce}: ${first_bid}, bound: ${self.get_bid_bound(offerNonce)}")
    
    async def on_bidHappened(self, offerNonce, moneyAmount, bidderNonce):
        if self.nonce == bidderNonce:
            self.logger.debug(f"Not countering bid: is my bid")
            return
        
        if self.get_last_bid(offerNonce) > moneyAmount:
            self.logger.debug(f"Not countering bid: already countered with better bid")
            return
        
        if self.get_bid_bound(offerNonce) < moneyAmount:
            self.logger.info(f"Not countering bid: bid surpassed own bound")
            return
        else:
            last_bid = self.get_last_bid(offerNonce)
            bid_increase = random.randint(*self.config["bid_increase_range"])
            new_bid = last_bid + bid_increase
            self.set_last_bid(offerNonce, new_bid)
            self.bidForFlexOffer(offerNonce, new_bid, self.nonce)
            self.logger.info(f"Countered bid for {offerNonce}: ${new_bid}")




if __name__ == "__main__":
    import json, argparse

    # Parse arguments
    parser = argparse.ArgumentParser(description="Spawns AutoBidders that automatically bid for flex-offers on the e-flex contract.")
    parser.add_argument("-n",dest="no_bidders", type=int, nargs='?', metavar='n', default=5, help="total amount of bidders to spawn")
    parser.add_argument("-url",dest="provider_url", type=str, nargs='?', metavar='url', default="http://localhost:7545/", help="http url to eth provider")
    parser.add_argument("-log", dest="log_level", type=str, nargs="?", metavar="level", default="INFO", help="logging level")
    args = parser.parse_args()

    # Setup config constants
    PROVIDER_URL = args.provider_url
    ABI_PATH = "../config/FlexSimAbi.json"
    DEPLOY_PATH = "../config/FlexSimDeploy.json"
    NUM_BIDDERS = args.no_bidders
    BIDDER_CONFIG = {
        "bidding_target_range": (20, 200),
        "first_bid_range": (10, 20),
        "bid_increase_range": (10, 30),
        "logging_level": getattr(logging, args.log_level.upper()),
        "logging_handler": logging.StreamHandler(),
    }

    # Load config files
    with open(ABI_PATH) as f:
        abi = json.load(f)["abi"]

    with open(DEPLOY_PATH) as f:
        address = json.load(f)["address"]
    
    flex_manager_contract_info = {
        "abi": abi,
        "address": address,
        "http_provider_url": PROVIDER_URL
    }

    # Start bidders
    bidders = [AutoBidder(BIDDER_CONFIG, **flex_manager_contract_info) for i in range(NUM_BIDDERS)]
    web3_contract.start_all()