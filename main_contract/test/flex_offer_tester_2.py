import json, time
import web3
from web3 import Web3, HTTPProvider


blockchain_address = 'http://127.0.0.1:7545/'

web3_A = Web3(HTTPProvider(blockchain_address))
web3_A.eth.defaultAccount = web3_A.eth.accounts[0]

web3_B = Web3(HTTPProvider(blockchain_address))
web3_B.eth.defaultAccount = web3_B.eth.accounts[1]

web3_C = Web3(HTTPProvider(blockchain_address))
web3_C.eth.defaultAccount = web3_B.eth.accounts[2]

compiled_contract_path = '../build/contracts/Flex_Offer.json'
deployed_contract_address = '0x5133EdBF16D5Da81D87F95f642464559EfE3eC82'

with open(compiled_contract_path) as file:
    contract_json = json.load(file)
    contract_abi = contract_json['abi']

contract_A = web3_A.eth.contract(address=deployed_contract_address,abi=contract_abi)
contract_B = web3_B.eth.contract(address=deployed_contract_address,abi=contract_abi)
contract_C = web3_C.eth.contract(address=deployed_contract_address,abi=contract_abi)


now = int(time.time())
hr = 60*60

# Test Case
# 1) Contract A creates the flexOffer
# 2) Check that the token created by A is minted
contract_A.functions.mint_flex_offer_to(5,2,int(now+0.5*hr),now+hr).transact()
flexOfferMinted_filter = contract_A.events.flexOfferMinted.createFilter(fromBlock = 'latest')
emitedTokenID = flexOfferMinted_filter.get_all_entries()[0].args.flexTokenId
# print("emitedTokenID: " + str(emitedTokenID))
balance_A = contract_A.functions.balanceOf(web3_A.eth.defaultAccount).call()
# print ("balance: " +str(balance_A))
tokenIdA = contract_A.functions.tokenOfOwnerByIndex(web3_A.eth.defaultAccount, balance_A-1).call()
# print("tokenIdA: " + str(tokenIdA))
if emitedTokenID == tokenIdA:
    print('Mint token function passed')

# 2) contract B will bid for the flex offer and win the contract
# Desired output is that B will own the contract
# Check the current bid to see if the bid is updated
# Check if the owner has changed
bid_1 = 5
tx_dict = {
    'to': deployed_contract_address,
    'from':web3_B.eth.defaultAccount,
    'value':bid_1 
}
contract_B.functions.BidForFlexOffer(tokenIdA).transact(tx_dict)
flexOfferBidSuccess_filter = contract_B.events.flexOfferBidSuccess.createFilter(fromBlock = 'latest')
flexOfferBidSuccess_args_dict = flexOfferBidSuccess_filter.get_all_entries()[0].args
success_bid_token_id = flexOfferBidSuccess_args_dict['flexTokenId']
bid_1_receipt = flexOfferBidSuccess_args_dict['bidReceipt']
# print("success_bid_token_id: " + str(success_bid_token_id))
balance_B = contract_B.functions.balanceOf(web3_B.eth.defaultAccount).call()
tokenIdB = contract_B.functions.tokenOfOwnerByIndex(web3_B.eth.defaultAccount, balance_B-1).call()

if success_bid_token_id == tokenIdB:
    print ('token id matches')
    curr_bid = contract_B.functions.flex_offers_mapping(success_bid_token_id).call()
    if curr_bid[5] == bid_1:
        print("bid matches")
        token_owner = contract_B.functions.ownerOf(tokenIdB).call()
        if token_owner == web3_B.eth.defaultAccount:
            print("token ownership Successfully transfered")
        else:
            print("token ownership not transferred")
    else:
        print("bid did not match")
else:
    print("transaction 3 fail test")

# 3) Get contract C to bid a lower value and get a rejection
# Check that the owner of the token belongs to B
flex_token_owner =  contract_B.functions.ownerOf(tokenIdB).call()
if flex_token_owner == web3_B.eth.defaultAccount:
    print("B retained ownership")
else:
    print("ownership transferred even with a lower bid")

bid_2 = 3
tx_dict_2 = {
    'to': deployed_contract_address,
    'from':web3_C.eth.defaultAccount,
    'value':bid_2
}

# contract_C.functions.BidForFlexOffer(tokenIdA).transact(tx_dict_2)

try:
    contract_C.functions.BidForFlexOffer(tokenIdA).transact(tx_dict_2)
except:
    print("bid 2 too low")

# Ensures that the event is not emitted
arg_filter = {
    'flexTokenId': success_bid_token_id
}
flexOfferBidSuccess_2_withdraw_filter = contract_B.events.flexOfferBidSuccess.createFilter(fromBlock = 'latest',argument_filters=arg_filter)
flexOfferBidSuccess_2_withdraw_dict = flexOfferBidSuccess_2_withdraw_filter.get_all_entries()
print("flexOfferBidSuccess_2_withdraw_dict: " + str(flexOfferBidSuccess_2_withdraw_dict))
curr_receipt = flexOfferBidSuccess_2_withdraw_dict[0].args['bidReceipt']
# compare receipt to make sure it is the first one
if curr_receipt == bid_1_receipt:
    print ('No new event was emitted')
else:
    print("event emit wrongly")




bid_3 = 10
tx_dict_3 = {
    'to': deployed_contract_address,
    'from':web3_C.eth.defaultAccount,
    'value':bid_3 
}
contract_C.functions.BidForFlexOffer(tokenIdA).transact(tx_dict_3)
flexOfferBidSuccess_3_filter = contract_C.events.flexOfferBidSuccess.createFilter(fromBlock = 'latest')
flexOfferBidSuccess_3_args_dict = flexOfferBidSuccess_3_filter.get_all_entries()[0].args
success_bid_3_token_id = flexOfferBidSuccess_3_args_dict['flexTokenId']
bid_3_receipt = flexOfferBidSuccess_3_args_dict['bidReceipt']
balance_C = contract_C.functions.balanceOf(web3_C.eth.defaultAccount).call()
tokenIdC = contract_C.functions.tokenOfOwnerByIndex(web3_C.eth.defaultAccount, balance_C-1).call()

if success_bid_3_token_id == tokenIdC:
    print ('token id matches for transaction 3')
    curr_bid = contract_C.functions.flex_offers_mapping(success_bid_3_token_id).call()
    if curr_bid[5] == bid_3:
        print("bid 3 matches")
    else:
        print("bid did not match")
else:
    print("transaction 3 fail test")


# Get contract B to withdraw the bid
arg_filter = {
    'flexTokenId': success_bid_token_id
}
flexOfferBidSuccess_3_withdraw_filter = contract_B.events.flexOfferBidSuccess.createFilter(fromBlock = 'latest',argument_filters=arg_filter)
flexOfferBidSuccess_3_withdraw_dict = flexOfferBidSuccess_3_withdraw_filter.get_all_entries()
print("flexOfferBidSuccess_3_withdraw_dict: " + str(flexOfferBidSuccess_3_withdraw_dict))

try:
    contract_B.functions.withdrawLowerBids(bid_1_receipt, tokenIdB, bid_1).transact()
    print("withdraw 1 passed")
except:
    print("withdraw 1 failed")

# Second time should throw an error
try:
    contract_B.functions.withdrawLowerBids(bid_1_receipt, tokenIdB, bid_1).transact()
    print("withdraw 2 passed")
except:
    print("withdraw 2 failed")
