import json
from web3 import Web3, HTTPProvider

blockchain_address = 'http://127.0.0.1:7545/'

web3 = Web3(HTTPProvider(blockchain_address))
# web3.eth.defaultAccount = web3.eth.accounts[0]
web3.eth.defaultAccount = web3.eth.accounts[0]


compiled_contract_path = '../build/contracts/Flex_Offers_Holder.json'
deployed_contract_address = '0x4275dA1DaA0C1Ae3Fb2AA33285867d47baAAFD9E'

with open(compiled_contract_path) as file:
    contract_json = json.load(file)
    contract_abi = contract_json['abi']

contract = web3.eth.contract(address=deployed_contract_address,abi=contract_abi)

message = contract.functions.testing().call()

print(message)

tx_hash = contract.functions.set_memory_string('bra bra bra').transact()

tx_receipt = web3.eth.waitForTransactionReceipt(tx_hash)
print( 'tx_hash: {}',format(tx_hash.hex()) )

