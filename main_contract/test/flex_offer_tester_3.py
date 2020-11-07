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

compiled_contract_path_wise = '../build/contracts/FlexWise.json'
compiled_contract_path_offer = '../build/contracts/FlexOffer.json'
compiled_contract_path_point = '../build/contracts/FlexPoint.json'
deployed_contract_address_wise = '0xDcB49B4bDaFb6E49dF33C4f1cE281081187dd066'

with open(compiled_contract_path_wise) as file:
    contract_wise_json = json.load(file)
    contract_wise_abi = contract_wise_json['abi']

with open(compiled_contract_path_offer) as file:
    contract_offer_json = json.load(file)
    contract_offer_abi = contract_offer_json['abi']

with open(compiled_contract_path_point) as file:
    contract_point_json = json.load(file)
    contract_point_abi = contract_point_json['abi']



contract_A_wise = web3_A.eth.contract(address=deployed_contract_address_wise,abi=contract_wise_abi)
FO_add =  contract_A_wise.functions.FO().call()
contract_A_Offer = web3_A.eth.contract(address=FO_add ,abi=contract_offer_abi)
contract_B = web3_B.eth.contract(address=deployed_contract_address_wise,abi=contract_wise_abi)
contract_C = web3_C.eth.contract(address=deployed_contract_address_wise,abi=contract_wise_abi)

# Test to bid via flexwise
now = int(time.time())
hr = 60*60

contract_A_wise.functions.mintFlexOfferTo(5,2,int(now+0.5*hr),now+hr).transact()
flexOfferMinted_filter = contract_A.events.flexOfferMinted.createFilter(fromBlock = 'latest')
emitedTokenID = flexOfferMinted_filter.get_all_entries()[0].args.flexTokenId
# print("emitedTokenID: " + str(emitedTokenID))
balance_A = contract_A.functions.balanceOf(web3_A.eth.defaultAccount).call()
# print ("balance: " +str(balance_A))
tokenIdA = contract_A.functions.tokenOfOwnerByIndex(web3_A.eth.defaultAccount, balance_A-1).call()
# print("tokenIdA: " + str(tokenIdA))
if emitedTokenID == tokenIdA:
    print('Mint token function passed')