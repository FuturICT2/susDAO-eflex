#!/bin/bash

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update

# Install programs
sudo apt update
sudo apt install yarn python3 nodejs python3-pip
# Install truffle
yarn global add truffle ganache-cli

# Install autobidder deps
python3 -m pip install -r auto_bidder/requirements.txt

# Install contract deps
cd main_contract
yarn install
cd ..

# Install web_frontend deps
cd web_frontend
yarn install
cd ..