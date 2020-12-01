import json, time
from web3 import Web3, HTTPProvider
import traceback
import copy
import pprint
from time import sleep

blockchain_address = 'http://127.0.0.1:7545/'
networkid = '5777'

web3_A = Web3(HTTPProvider(blockchain_address))
web3_A.eth.defaultAccount = web3_A.eth.accounts[0]

web3_B = Web3(HTTPProvider(blockchain_address))
web3_B.eth.defaultAccount = web3_B.eth.accounts[1]

web3_C = Web3(HTTPProvider(blockchain_address))
web3_C.eth.defaultAccount = web3_B.eth.accounts[2]

compiled_offer_path = '../build/contracts/FlexOffer.json'
compiled_point_path = '../build/contracts/FlexPoint.json'
# deployed_offer_address = '0x199A786581e00938445a36E100C35F8F5f5022d5'

with open(compiled_offer_path) as file:
    offer_json = json.load(file)
    offer_abi = offer_json['abi']


deployed_offer_address = offer_json["networks"][networkid]["address"]
# print(deployed_offer_address)
account_A = web3_A.eth.contract(address=deployed_offer_address,abi=offer_abi)
account_B = web3_B.eth.contract(address=deployed_offer_address,abi=offer_abi)
account_C = web3_C.eth.contract(address=deployed_offer_address,abi=offer_abi)

add_A = web3_A.eth.defaultAccount
add_B = web3_B.eth.defaultAccount
add_C = web3_C.eth.defaultAccount

FP_add =  account_A.functions.FP().call()
with open(compiled_point_path) as file:
    point_json = json.load(file)
    point_abi = point_json['abi']
account_A_point = web3_A.eth.contract(address=FP_add,abi=point_abi)
account_B_point = web3_A.eth.contract(address=FP_add,abi=point_abi)
account_C_point = web3_A.eth.contract(address=FP_add,abi=point_abi)

address_dict = {
    add_A:'A',
    add_B:'B',
    add_C:'C'
}

user_dict = {
    'A':{
        'acc': account_A,
        'acc_p':account_A_point,
        'add': add_A
    },
    'B':{
        'acc': account_B,
        'acc_p':account_B_point,
        'add': add_B
    },
    'C':{
        'acc': account_C,
        'acc_p':account_C_point,
        'add': add_C
    },    
}

flex_point_dict = {

}

FP_add =  account_A.functions.FP().call()
with open(compiled_point_path) as file:
    point_json = json.load(file)
    point_abi = point_json['abi']
contract_A_point = web3_A.eth.contract(address=FP_add,abi=point_abi)

def sleep_counter(time):
    intervals = int(time/5)
    count = 0
    for i in range(intervals):
        print('{0} seconds'.format(count))
        count += 5
        sleep(5)


def create_flex_offer(account,add,power,duration,start_time,end_time):
    print('============== Account {0} attempt to mint flex offer =============='.format(address_dict[add]))
    try:
        account.functions.mint_flex_offer_to(power,duration,start_time,end_time).transact()
    except Exception as e: 
        print(e.args[0]['message'])
        return
    flexOfferMinted_filter = account.events.flexOfferMinted.createFilter(fromBlock = 'latest')
    emitedTokenID = flexOfferMinted_filter.get_all_entries()[0].args.flexOfferId
    balance_A = account.functions.balanceOf(add).call()
    tokenIdA = account.functions.tokenOfOwnerByIndex(add, balance_A-1).call()
    if emitedTokenID == tokenIdA:
        print('Mint token function passed')
    print ("Account {0} has minted flex offer with id {1}".format(address_dict[add],tokenIdA))

    return tokenIdA

def bid_flex_offer(account,add, flex_offer_id, bid_price):
    print('============== Account {0} is bidding for flex offer {1} with price {2} ================='.format(address_dict[add],flex_offer_id,bid_price))
    tx_dict = {
        'to': deployed_offer_address,
        'from':add,
        'value': bid_price
    }
    try:
        account.functions.BidForFlexOffer(flex_offer_id).transact(tx_dict)
    except Exception as e: 
        print(e.args[0]['message'])
        return
    flexOfferBidSuccess_filter = account.events.flexOfferBidSuccess.createFilter(fromBlock = 'latest')
    flexOfferBidSuccess_args_dict = flexOfferBidSuccess_filter.get_all_entries()[0].args
    success_bid_token_id = flexOfferBidSuccess_args_dict['flexOfferId']
    balance_B = account.functions.balanceOf(add).call()
    tokenIdB = account.functions.tokenOfOwnerByIndex(add, balance_B-1).call()

    # contract_balance = web3_A.eth.getBalance(deployed_offer_address)
    # print ("contract_balance first bid: " + str(contract_balance)) 

    if success_bid_token_id == tokenIdB:
        print ('token id matches')
        flex_offer_data = account.functions.flex_offers_mapping(success_bid_token_id).call()
        if flex_offer_data[5] == bid_price:
            print("bid matches")
            token_owner = account.functions.ownerOf(tokenIdB).call()
            if token_owner == add:
                print("token ownership Successfully transfered")
            else:
                print("token ownership not transferred")
        else:
            print("bid did not match")
    else:
        print("transaction fail test")

def contract_state_by_accounts():
    print('===================== check account state =============================')
    for user in user_dict:
        # print(user_dict[user]['acc'].functions.balanceOf(user_dict[user]['add']).call())
        user_dict[user]['tokens_own'] = user_dict[user]['acc'].functions.balanceOf(user_dict[user]['add']).call()
        user_dict[user]['points_own'] = user_dict[user]['acc_p'].functions.balanceOf(user_dict[user]['add']).call()
    pprint.pprint(user_dict)


# Include a check for the emited event
def activate_flex_offer(account,add,flex_offer_id):
    print('==================== activating flex offer {0} ==================='.format(flex_offer_id))
    try:
        account.functions.ActivateFlexOffer(flex_offer_id).transact()
        print('flex offer activated')
        # Check if the token is being burned
        try:
            flex_off_owner = account.functions.ownerOf(flex_offer_id).call()
            print('flex_off_owner"{0}'.format(flex_off_owner))
        except Exception as e: 
            print(e.args[0]['message'])
            # return
        return 'activated'
    except Exception as e: 
        print(e.args[0]['message'])
        return

def flex_offers_created_by(account,add):
    # flex_offers = []
    tot_created_fo = account.functions.GetMyTotMintedFlexOffers(add).call()
    print('total offers created: {0}'.format(tot_created_fo))
    # for i in range (tot_created_fo):
    #     temp_dict = {
    #         'flex_offer_id':account.functions.GetMyFlexOffer(add,i).call(),
    #         'flex_offer_info':account.functions.flex_offers_mapping(i).call()
    #     }
    #     flex_offers.append(temp_dict)
    # print(flex_offers)

def end_time_activate(account,flex_offer_id):
    print('=================== end time activation from account {0} for flex offer {1}'.format(account,flex_offer_id))
    try:
        account.functions.EndTimeActivate(flex_offer_id).transact()
        print('flexoffer was activated at end time')
            # Check if the token is being burned
        try:
            flex_off_owner = account.functions.ownerOf(flex_offer_id).call()
            print('flex_off_owner"{0}'.format(flex_off_owner))
        except Exception as e: 
            print(e.args[0]['message'])
            # return
        return 'activated'
    except Exception as e: 
        print(e.args[0]['message'])
        return

def claim_eth_with_flex_points(account,perc):


if __name__ == "__main__":
    now = int(time.time())
    flex_offer_id_1 = create_flex_offer(account_A,add_A,10,2,int(now+50),now+200)
    now = int(time.time())
    flex_offer_id_1 = create_flex_offer(account_A,add_A,10,2,int(now+65),now+100)
    sleep(1)
    now = int(time.time())
    flex_offer_id_2 = create_flex_offer(account_A,add_A,10,1,int(now+70),now+100)
    contract_state_by_accounts()
    bid_flex_offer(account_B,add_B,flex_offer_id_1,5)
    bid_flex_offer(account_B,add_B,flex_offer_id_2,5)
    bid_flex_offer(account_C,add_C,flex_offer_id_1,3)
    bid_flex_offer(account_C,add_C,flex_offer_id_1,6)
    contract_state_by_accounts()
    activate_flex_offer(account_B,add_B,flex_offer_id_1)
    time_passed = False
    while not time_passed:
        sleep_counter(10)
        activated = activate_flex_offer(account_C,add_C,flex_offer_id_1)
        if activated == 'activated':
            time_passed = True
    contract_state_by_accounts()
    end_time_activate(account_A,flex_offer_id_2)
    time_passed = False
    while not time_passed:
        sleep_counter(10)
        activated = end_time_activate(account_A,flex_offer_id_2)
        if activated == 'activated':
            time_passed = True
    contract_state_by_accounts()

    flex_offers_created_by(account_A,add_A)
