# Setup everything
setup: setup_auto_bidder setup_web_frontend setup_contract

setup_web_frontend: .FORCE
	cd web_frontend; yarn install

setup_auto_bidder: .FORCE
	cd auto_bidder; python3 -m pip install -r requirements.txt

setup_contract: .FORCE
	cd main_contract; yarn install; truffle deploy --reset

autobidder: .FORCE
	cd auto_bidder; python3 auto_bidder.py

autoofferer: .FORCE
	cd auto_bidder; python3 auto_offerer.py

web_frontend: .FORCE
	cd web_frontend; yarn start

# Launches ganache in accordance to config/GanacheNetwork.json configuration
ganache: .FORCE 
	ganache-cli --account_keys_path config/keys.json --port 8545 --networkId 5777 --host 0.0.0.0  --seed 0

# Launches ganache exposed to outside world
ganache-exposed: .FORCE
	ganache-cli --account_keys_path config/keys.json --port 8545 --networkId 5777 --host 0.0.0.0  --seed 0

.FORCE:
