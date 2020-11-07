# Setup everything
setup: setup_auto_bidder setup_web_frontend

setup_web_frontend: .FORCE
	cd web_frontend; yarn install

setup_auto_bidder: .FORCE
	cd auto_bidder; python3 -m pip install -r requirements.txt

autobidder: .FORCE
	cd auto_bidder; python3 auto_bidder.py

web_frontend: .FORCE
	cd web_frontend; yarn start

.FORCE: