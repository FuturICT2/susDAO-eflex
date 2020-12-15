![flexwise](web_frontend/public/logo.png)

Flexwise is a prototype of a decentralized marketplace selling electric power demand flexibility, exploring the possibility of decentralized demand side power management. 

Read the [report](report.pdf) or try out the live demonstration at:

> flexwise.sgyger.com

Parts of the DApp run on Ethereum and hence require a crypto wallet like [Metamask](https://metamask.io/) to run properly. The associated contracts are currently only deployed on a private blockchain. Use the following RPC credentials to gain access to it:

* **RPC-URL**  http://ganache.sgyger.com/
* **Port**  80
* **Chain ID**  5777

Some functions can only be executed with Ethereum; press "Show Keys" at the top right to get a list of private keys that have Ethereum associated with them. Or use one of these:

* 41219e3efe938f4b1b5bd68389705be763821460b940d5e2bd221f66f40028d3
* 76db32cb46895cdb4473c86b4468dbd45f46c1b3d7972002c72bea74efff18ef
* df207d299d941818bb4f7822cf003662370a7d685016dfc3f1e2cac03d47fc1d



## Setup

First, install dependencies:
```sh
sh setup.sh
```
This will install globally:
* Python3, in it package "web3"
* Yarn
* Ganache-ClI
* Truffle
* Node.js

And setup the local dev environments.


There are multiple aspects to this project. For one, there's the smart contract itself, but there's also a webpage, run by a node server, and some market participant simulators, written in python.

A makefile is provided to make setup as easy as possible. Apart from the contract deployment command, none of these commands return, so  they have to be run in a different shell instance each:

* Start ganache:
    
        make ganache

* Deploy contracts

        make setup_contract

* Start the auto bidder (optional, simulates bidders on market)

        make autobidder

* Start the auto offerer (optional, simulates offerers on market)

        make autoofferer

* Start the web frontend (optional, provides a visual overview over the contract, and ways to interact with it)

        make web_frontend

The web frontend should open automatically once ready, otherwise it can be reached through `localhost:3000`.

To get access to an account that has some ethereum associated with it, ganache generates some and puts their respective keys into `config/keys.json`. They can also be accessed from the web GUI as explained above. 



## Token Design and implementation
There are two tokens that are created for the flexwise implementation:
1. FlexOffer
2. FlexPoint

### **Flex offer** provides an API with the following functions and event emitters
1. mint_flex_offer_to(uint power, uint duration, uint start_time,uint end_time)
    * It takes in the above inputs and is used by a wallet when they intantiate a new flex offer
    * The created flex token will be given to the caller of this function
    * Currently, we assume some verification mechanism is in place to prove the validity of the flex offer
    * This function emits an event **flexOfferMinted(_flex_offer_id)**
    * use transact() for this function

2. BidForFlexOffer(uint256 flexOfferId)
    * Transact() this function to bid for the flex offer
    * Send ETH together with this function and if the current Bid for the offer is lower than the amount you sent, then the ownership will be transferred to the sender
    * If bid is successful this function will **emit an event flexOfferBidSuccess(flexOfferId)**
        * Take note that the previous owner will be reimbursed with their bid automatically.
    * Function will not reject any bids if the flexoffer is less than 15 mins to activation window

3. ActivateFlexOffer(uint256 flexOfferId)
    * Transact() this function to activate the flex offer
    * Only the current owner of the flex offer can call this function
    * This function is only callable with the time window as provided within the token
    * On the successful calling of this function:
        * flexPoints will be calculated and issued to the created of the flex offer
        * the flexoffer will be burned
        * the event **flexOfferActivation(flexOfferId ,flexPointCalc)** will be emited potentially for the physical machine to lookout for and to start the machine

4. EndTimeActivate(uint256 flexOfferId)
    * This is a fall back function to call the start of the machine if:
        * Flex offer is not sold
        * Flex offer was sold but not activated at all
    * Can only be called by the original creator of the flex offer
    * emits an event **flex_offer_burned (flexOfferId)**
    * May be used by machine to signal it has started on default so that the flex offer can be burn on the blockchain

5. ClaimEthWithFlexPoint(uint pointAmount)
    * Use this function to convert current flexpoints in the caller's account into ETH
    * The amount of ETH being given to the caller depends on the fraction of the flexpoints the caller has in relation to the total supply of flexpoints
    * upon calling, the corresponding eth will be reimbursed to the caller and the exchanged flexpoints will be burned
    * the event **ethForFlexPoint(_msgSender(), ethAmount, ethBalance,flexPointSupply,pointAmount)** will be emited upon successful transaction

6. GetMyTotMintedFlexOffers(address _address)
    * Takes in an address as the input
    * Call this to get the total number of contracts that you have minted.
    * This also represents the length of the list that you can iterate through to access your contracts

7. GetMyFlexOffer(address _address, uint256 i)
    * Takes in an address and the index
    * Call this to get the specific contract that you have created
    * Will return the flexOfferId in chronoloigcal order with the i=0 giving your first ever flexOffer offered by you
    * use GetMyTotMintedFlexOffers() to find out how many you have in total so you can iterate over it

### Call functions

There are actually 2 contracts deployed for flexwise:
1. FlexOffer
2. FlexPoint

**FlexOffer** is the main point of interaction where you can transact. It inherits from an ERC721 contract and so has all the default functionalities of the contract. You can for example view how many flex offers you currently own or view the list of activate flex offers and their current bit price.

**FlexPoint** is generated by the **FlexOffer** contract. It inherits from an ERC20 contract and has all the default functionalities of an ERC20 token. Currently designed interactions like exchanging flexpoints with eth should be called via the **FlexOffer** contract but other functions such as viewing the balance of FlexPoints in your account should be called to the FlexPoint contract directly. 

The **Flexpoint contract address** is stored within the **FP** variable within the **FlexOffer** contract. Use this address to make call functions such as checking your personal balance and the current total supply to derive the current eth/flexpoint rate. 



## deprecated functions

2. BidForFlexOffer(uint256 flexOfferId)
    * Transact() this function to bid for the flex offer
    * Send ETH together with this function and if the current Bid for the offer is lower than the amount you sent, then the ownership will be transferred to the sender
    * If bid is successful this function will **emit an event flexOfferBidSuccess(flexOfferId, bidReceipt)**
        * Take note that this event will contain the **bidReceipt**. The bidReceipt is uniquely generated and is used to verify your withdrawal of your claim if your bid was overbidded 
    * Function will not reject any bids if the flexoffer is less than 15 mins to activation window

3. withdrawLowerBids(uint256 bidReceipt, uint256 flexOfferId, uint claim)
    * Transact() this function to take back the ETH if your bid was being over bid
    * Take note. You will need to remember the specific flex offer, the corresponding bidReceipt and how much you bid it for
    * The function will ensure that these 3 information matches before sending the corresponding eth to the caller of this function
    * Ensure to keep the above 3 information secret as anyone with the information can collect the eth.
    * **future implementation**: I will be including a functionality that stores the address of the failed bidder to increase security
    * Since there is no way for a smart contract to activate itself, it is up to the bidder to listen to the event emits and withdraw their bid
