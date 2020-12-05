
import web3_contract, asyncio, random, logging, pprint, time



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
        self.finished_offerIds = set() # contains offers for which we don't bid anymore. 
        
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
    def get_bid_increase(self):
        return random.randint(*self.config["bid_increase_range"])

    def get_increased_bid(self, offer_nonce):
        incr = self.get_last_bid(offer_nonce) + self.get_bid_increase()
        self.set_last_bid(offer_nonce, incr)
        return incr
    

    async def on_flexOfferMinted(self, flexOfferId, og_owner):
        """ Makes an initial bid. Expected to be called once per offer. """
        self.bid_until_successful(flexOfferId)
    
    async def on_flexOfferBidSuccess(self, flexOfferId, new_owner, bid_amount):
        if bid_amount != self.get_last_bid(flexOfferId):
            self.bid_until_successful(flexOfferId, bid_amount)
        else:
            self.logger.debug(f"Not countering bid for {flexOfferId}: Is my bid.")

    def bid_until_successful(self, flexOfferId, lastBid=None):
        if flexOfferId in self.finished_offerIds:
            return
        """ Bids in increasing steps until bound is reached or no error is thrown. """
        while True:
            last_bid = self.get_last_bid(flexOfferId)
            if last_bid >= self.get_bid_bound(flexOfferId):
                self.logger.info(f"Not bidding for {flexOfferId}: (amount: {lastBid}) bid surpassed own bound {self.get_bid_bound(flexOfferId)}")
                self.finished_offerIds.add(flexOfferId)
                return
            
            new_bid = self.get_increased_bid(flexOfferId)
            try:
                self.bid_for_offer(flexOfferId, new_bid)
                msg = "New Bid" if lastBid is None else f"Bid against {lastBid}"
                self.logger.info(f"{msg}, offer {flexOfferId}: Ξ{new_bid}")
                return
            except:
                pass # Ignore web3py's errors
            
        

    def bid_for_offer(self, offerId, offer_amount):
        """ bids offer_amount wei for offer offerId """
        # Create transaction
        funcall = self.contract.functions.BidForFlexOffer(offerId)
        nonce = self.w3.eth.getTransactionCount(self.account.address)
        trans = funcall.buildTransaction({
            "nonce": nonce,
            "value": offer_amount
        })
        # Sign transaction
        signed_trans = self.account.sign_transaction(trans)
        # Send transaction
        self.w3.eth.sendRawTransaction(signed_trans.rawTransaction)


if __name__ == "__main__":
    import json, argparse
    from config import config

    # Parse arguments
    parser = argparse.ArgumentParser(description="Spawns AutoBidders that automatically bid for flex-offers on the e-flex contract.")
    parser.add_argument("-n",dest="no_bidders", type=int, nargs='?', metavar='n', default=5, help="total amount of bidders to spawn")
    parser.add_argument("-url",dest="provider_url", type=str, nargs='?', metavar='url', default=config.provider_url, help="http url to eth provider")
    parser.add_argument("-log", dest="log_level", type=str, nargs="?", metavar="level", default="INFO", help="logging level")
    args = parser.parse_args()

    # Setup config constants
    PROVIDER_URL = args.provider_url
    NUM_BIDDERS = args.no_bidders
    BIDDER_CONFIG = {
        "bidding_target_range": (20, 400),
        "first_bid_range": (10, 20),
        "bid_increase_range": (10, 30),
        "logging_level": getattr(logging, args.log_level.upper()),
        "logging_handler": logging.StreamHandler(),
    }
    
    flex_manager_contract_info = {
        "abi": config.flex_offer_abi,
        "address": config.flex_offer_address,
        "http_provider_url": PROVIDER_URL,
        "private_key": config.accounts[1]["private_key"]
    }

    # Start bidders
    bidders = [AutoBidder(BIDDER_CONFIG, **flex_manager_contract_info) for i in range(NUM_BIDDERS)]
    web3_contract.start_all()