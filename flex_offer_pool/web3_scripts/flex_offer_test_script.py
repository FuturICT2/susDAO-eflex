import json, time
from web3 import Web3, HTTPProvider

blockchain_address = 'http://127.0.0.1:7545/'

web3_A = Web3(HTTPProvider(blockchain_address))
# web3.eth.defaultAccount = web3.eth.accounts[0]
web3_A.eth.defaultAccount = web3_A.eth.accounts[0]

web3_B = Web3(HTTPProvider(blockchain_address))
# web3.eth.defaultAccount = web3.eth.accounts[0]
web3_B.eth.defaultAccount = web3_B.eth.accounts[1]



compiled_contract_path = '../build/contracts/Flex_Offer.json'
deployed_contract_address = '0x312441bBB80B5cA26CBdE5Eb51282c7E4709Ffa2'

with open(compiled_contract_path) as file:
    contract_json = json.load(file)
    contract_abi = contract_json['abi']

contract_A = web3_A.eth.contract(address=deployed_contract_address,abi=contract_abi)
contract_B = web3_B.eth.contract(address=deployed_contract_address,abi=contract_abi)

# message = contract.functions.testing().call()

# print(message)

# tx_hash = contract.functions.set_memory_string('bra bra bra').transact()

# tx_receipt = web3.eth.waitForTransactionReceipt(tx_hash)
# print( 'tx_hash: {}',format(tx_hash.hex()) )

now = int(time.time())
hr = 60*60 

# print(int(0.5*hr))

# contract_A.functions.setApprovalForAll(deployed_contract_address,True).transact()
# contract_B.functions.setApprovalForAll(deployed_contract_address,True).transact()

token_id_returned = contract_A.functions.mint_flex_offer_to(5,2,int(now+0.5*hr),now+hr).transact()
balance_A = contract_A.functions.balanceOf(web3_A.eth.defaultAccount).call()
print ("balance: " +str(balance_A))
token_id_A = contract_A.functions.tokenOfOwnerByIndex(web3_A.eth.defaultAccount, balance_A-1).call()

print ("flex offer A is created with token id: " + str(token_id_A))

# flex_offer_B_id = contract_B.functions.mint_flex_offer_to(10,3,int(now+0.5*hr),now+hr).transact()

# print ("flex offer B is created with token id: " + str(int(flex_offer_B_id)))

total_supply = contract_A.functions.totalSupply().call()

print ('total supply: ' + str(total_supply))

# balance = contract_A.functions.balanceOf(web3_A.eth.defaultAccount).call()

# print (balance)

flex_offer_id =  contract_A.functions.tokenByIndex(total_supply-1).call()

print ('flex_offer_id: ' + str(flex_offer_id))

token_owner = contract_A.functions.ownerOf(flex_offer_id).call()

print ('Contract A add:' + str(web3_A.eth.defaultAccount))
print ('Contract B add:' + str(web3_B.eth.defaultAccount))
print ('token owner: ' + str(token_owner))

token_struct_A = contract_A.functions.flex_offers_mapping(flex_offer_id).call()
token_struct_B = contract_B.functions.flex_offers_mapping(flex_offer_id).call()

# print ("token_struct: " + str(token_struct))
print (token_struct_A)
print (token_struct_B)

approve_address = contract_A.functions.getApproved(flex_offer_id).call()

print ("contract address: " + str(deployed_contract_address))
print ("approved address: " + str(approve_address))

# contract_A.functions.safeTransferFrom(web3_A.eth.defaultAccount,)

contract_A.functions.bid_for_flex_offer(flex_offer_id,9,web3_A.eth.defaultAccount).transact()

token_struct_A = contract_A.functions.flex_offers_mapping(flex_offer_id).call()
token_owner = contract_A.functions.ownerOf(flex_offer_id).call()
print (token_struct_A)
print ('Contract A add:' + str(web3_A.eth.defaultAccount))
print ('Contract B add:' + str(web3_B.eth.defaultAccount))
print ('token owner: ' + str(token_owner))


contract_B.functions.bid_for_flex_offer(flex_offer_id,20,web3_B.eth.defaultAccount).transact()

token_struct_A = contract_A.functions.flex_offers_mapping(flex_offer_id).call()
token_owner = contract_A.functions.ownerOf(flex_offer_id).call()
print (token_struct_A)
print ('Contract A add:' + str(web3_A.eth.defaultAccount))
print ('Contract B add:' + str(web3_B.eth.defaultAccount))
print ('token owner: ' + str(token_owner))


contract_A.functions.bid_for_flex_offer(flex_offer_id,19,web3_A.eth.defaultAccount).transact()

token_struct_A = contract_A.functions.flex_offers_mapping(flex_offer_id).call()
token_owner = contract_A.functions.ownerOf(flex_offer_id).call()
print (token_struct_A)
print ('Contract A add:' + str(web3_A.eth.defaultAccount))
print ('Contract B add:' + str(web3_B.eth.defaultAccount))
print ('token owner: ' + str(token_owner))