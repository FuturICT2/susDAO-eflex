import json, time
from web3 import Web3, HTTPProvider


blockchain_address = 'http://127.0.0.1:7545/'

web3_A = Web3(HTTPProvider(blockchain_address))
web3_A.eth.defaultAccount = web3_A.eth.accounts[0]

web3_B = Web3(HTTPProvider(blockchain_address))
web3_B.eth.defaultAccount = web3_B.eth.accounts[1]

web3_C = Web3(HTTPProvider(blockchain_address))
web3_C.eth.defaultAccount = web3_B.eth.accounts[2]

compiled_offer_path = '../build/contracts/FlexOffer.json'
compiled_point_path = '../build/contracts/FlexPoint.json'
deployed_offer_address = '0xDc6AC4E26D052509C6953049EAD8DDE2B51CA6d1'

with open(compiled_offer_path) as file:
    offer_json = json.load(file)
    offer_abi = offer_json['abi']

contract_A = web3_A.eth.contract(address=deployed_offer_address,abi=offer_abi)
contract_B = web3_B.eth.contract(address=deployed_offer_address,abi=offer_abi)
contract_C = web3_C.eth.contract(address=deployed_offer_address,abi=offer_abi)

FP_add =  contract_A.functions.FP().call()
with open(compiled_point_path) as file:
    point_json = json.load(file)
    point_abi = point_json['abi']
contract_A_point = web3_A.eth.contract(address=FP_add,abi=point_abi)


def one_run():
    now = int(time.time())
    hr = 60*60

    # Test Case
    # 1) Contract A creates the flexOffer
    # 2) Check that the token created by A is minted
    contract_A.functions.mint_flex_offer_to(10,2,int(now+0.5*hr),now+hr).transact()
    flexOfferMinted_filter = contract_A.events.flexOfferMinted.createFilter(fromBlock = 'latest')
    emitedTokenID = flexOfferMinted_filter.get_all_entries()[0].args.flexOfferId
    print("minted event dict: " + str(flexOfferMinted_filter.get_all_entries()))
    # print("emitedTokenID: " + str(emitedTokenID))
    balance_A = contract_A.functions.balanceOf(web3_A.eth.defaultAccount).call()
    # print ("balance: " +str(balance_A))
    tokenIdA = contract_A.functions.tokenOfOwnerByIndex(web3_A.eth.defaultAccount, balance_A-1).call()
    # print("tokenIdA: " + str(tokenIdA))
    if emitedTokenID == tokenIdA:
        print('Mint token function passed')

    contract_balance = web3_A.eth.getBalance(deployed_offer_address)
    print ("contract_balance base: " + str(contract_balance)) 

    # 2) contract B will bid for the flex offer and win the contract
    # Desired output is that B will own the contract
    # Check the current bid to see if the bid is updated
    # Check if the owner has changed
    bid_1 = 5
    tx_dict = {
        'to': deployed_offer_address,
        'from':web3_B.eth.defaultAccount,
        'value': bid_1
    }
    contract_B.functions.BidForFlexOffer(tokenIdA).transact(tx_dict)
    flexOfferBidSuccess_filter = contract_B.events.flexOfferBidSuccess.createFilter(fromBlock = 'latest')
    flexOfferBidSuccess_args_dict = flexOfferBidSuccess_filter.get_all_entries()[0].args
    success_bid_token_id = flexOfferBidSuccess_args_dict['flexOfferId']
    balance_B = contract_B.functions.balanceOf(web3_B.eth.defaultAccount).call()
    tokenIdB = contract_B.functions.tokenOfOwnerByIndex(web3_B.eth.defaultAccount, balance_B-1).call()

    contract_balance = web3_A.eth.getBalance(deployed_offer_address)
    print ("contract_balance first bid: " + str(contract_balance)) 

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
        'to': deployed_offer_address,
        'from':web3_C.eth.defaultAccount,
        'value':bid_2
    }

    try:
        contract_C.functions.BidForFlexOffer(tokenIdA).transact(tx_dict_2)
    except:
        print("bid 2 too low")

    contract_balance = web3_A.eth.getBalance(deployed_offer_address)
    print ("contract_balance failed bid: " + str(contract_balance)) 

    # Ensures that the event is not emitted
    arg_filter = {
        'flexOfferId': success_bid_token_id
    }
    flexOfferBidSuccess_2_withdraw_filter = contract_B.events.flexOfferBidSuccess.createFilter(fromBlock = 'latest',argument_filters=arg_filter)
    flexOfferBidSuccess_2_withdraw_dict = flexOfferBidSuccess_2_withdraw_filter.get_all_entries()
    print("flexOfferBidSuccess_2_withdraw_dict: " + str(flexOfferBidSuccess_2_withdraw_dict))

    # check for account B eth before losing bid
    B_before_lose = web3_B.eth.getBalance(web3_B.eth.defaultAccount)

    bid_3 = 10
    tx_dict_3 = {
        'to': deployed_offer_address,
        'from':web3_C.eth.defaultAccount,
        'value':bid_3
    }
    contract_C.functions.BidForFlexOffer(tokenIdA).transact(tx_dict_3)
    flexOfferBidSuccess_3_filter = contract_C.events.flexOfferBidSuccess.createFilter(fromBlock = 'latest')
    flexOfferBidSuccess_3_args_dict = flexOfferBidSuccess_3_filter.get_all_entries()[0].args
    success_bid_3_token_id = flexOfferBidSuccess_3_args_dict['flexOfferId']
    balance_C = contract_C.functions.balanceOf(web3_C.eth.defaultAccount).call()
    tokenIdC = contract_C.functions.tokenOfOwnerByIndex(web3_C.eth.defaultAccount, balance_C-1).call()

    contract_balance = web3_A.eth.getBalance(deployed_offer_address)
    print ("contract_balance second bid success: " + str(contract_balance)) 

    # get B account balance after losing bid
    B_after_lose = web3_B.eth.getBalance(web3_B.eth.defaultAccount)

    if B_after_lose > B_before_lose:
        print("money transfered back: " + str(B_after_lose - B_before_lose))
    else:
        print("money did not get transferred back")

    if success_bid_3_token_id == tokenIdC:
        print ('token id matches for transaction 3')
        curr_bid = contract_C.functions.flex_offers_mapping(success_bid_3_token_id).call()
        if curr_bid[5] == bid_3:
            print("bid 3 matches")
        else:
            print("bid did not match")
    else:
        print("transaction 3 fail test")

    # Check if the token is being burned
    flex_off_owner = contract_C.functions.ownerOf(tokenIdC).call()
    print("flex_off_owner before: " + str(flex_off_owner))

    # Check for activation of flex offer

    # Get the flexpoint contract

    # Check contract A flexpoint balance
    contract_A_balance = contract_A_point.functions.balanceOf(web3_A.eth.defaultAccount).call()
    print("contract_A_balance: " + str(contract_A_balance))


    # Check that the event is being emitted
    contract_C.functions.ActivateFlexOffer(tokenIdC).transact()
    flexOfferActivation_filter = contract_C.events.flexOfferActivation.createFilter(fromBlock = 'latest')
    flexOfferActivation_dict = flexOfferActivation_filter.get_all_entries()
    print("flexOfferActivation_dict: " + str(flexOfferActivation_dict))

    # Check if the token is being burned
    try:
        flex_off_owner = contract_C.functions.ownerOf(tokenIdC).call()
    except ValueError:
        print("token is burn")

    # Check contract A flexpoint balance after activation
    contract_A_balance = contract_A_point.functions.balanceOf(web3_A.eth.defaultAccount).call()
    print("contract_A_balance: " + str(contract_A_balance))

# Time to get money out of the bank
def get_money_out():
    contract_balance = web3_A.eth.getBalance(deployed_offer_address)
    print ("flex Offer contract balance eth: " + str(contract_balance))

    contract_A_eth_before = web3_A.eth.getBalance(web3_A.eth.defaultAccount)
    print ("contract_A_eth before: " + str(contract_A_eth_before))

    total_flex_points = contract_A_point.functions.totalSupply().call()
    print ("total_flex_points: "+ str(total_flex_points))

    contract_A_flexPoints = contract_A_point.functions.balanceOf(web3_A.eth.defaultAccount).call()
    print("contract_A_flexPoints before: " + str(contract_A_flexPoints))

    claimAmount = contract_A_flexPoints/2
    print('claimAmount: '+ str(claimAmount))

    payout = (claimAmount/total_flex_points)*contract_balance
    print("expected payout: "+ str(payout))

    contract_A.functions.ClaimEthWithFlexPoint(int(claimAmount)).transact()

    # get emitted event
    claim_filter = contract_A.events.ethForFlexPoint.createFilter(fromBlock = 'latest')
    claim_dict = claim_filter.get_all_entries()
    print("claim_dict: " + str(claim_dict))

    contract_A_flexPoints = contract_A_point.functions.balanceOf(web3_A.eth.defaultAccount).call()
    print("contract_A_flexPoints after: " + str(contract_A_flexPoints))

    contract_A_eth_after = web3_A.eth.getBalance(web3_A.eth.defaultAccount)
    print ("contract_A_eth after: " + str(contract_A_eth_after))

    print("eth difference: " + str(contract_A_eth_after-contract_A_eth_before))





# Still need to verify that the calculations are correct
one_run()
one_run()
print("Time to get money outttttttttttttttttttttttttt")
get_money_out()





