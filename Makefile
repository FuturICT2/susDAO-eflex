# Setup everything
setup: setup_auto_bidder setup_web_frontend

setup_web_frontend: .FORCE
	cd web_frontend; yarn install

setup_auto_bidder: .FORCE
	cd auto_bidder; python3 -m pip install -r requirements.txt

deploy_contract:
	cd main_contract; truffle deploy

autobidder: .FORCE
	cd auto_bidder; python3 auto_bidder.py

autoofferer: .FORCE
	cd auto_bidder; python3 auto_offerer.py

web_frontend: .FORCE
	cd web_frontend; yarn start

# Launches ganache in accordance to config/GanacheNetwork.json configuration
ganache: .FORCE
	ganache-cli --db _chain/ --account_keys_path config/keys.json --port 8545 -seed 0 --i 5777


.FORCE: