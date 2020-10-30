// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

contract FlexMngrSim {

    event bidHappened(int offerNonce, int moneyAmount, int bidderNonce);
    event deviceTurnedOn(int offerNonce);
    event offerCreated(int offerNonce);

    function bidForFlexOffer(int offerNonce, int moneyAmount, int bidderNonce) public {
        emit bidHappened(offerNonce, moneyAmount, bidderNonce);
    }

    function turnOnDeviceOfFlexOffer(int offerNonce) public {
        emit deviceTurnedOn(offerNonce);
    }

    function createFlexOffer(int offerNonce) public returns (int) {
        emit offerCreated(offerNonce);
        return 2;
    }






}
