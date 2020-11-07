// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract FlexPoint is ERC20, ERC20Burnable, Ownable{

    constructor() ERC20("FlexPoint","FP") public {
    }

    function IssueFlexPoint(address _address, uint256 pointAmount) public onlyOwner {
        _mint(_address, pointAmount);
    }

    function ClaimFlexPoints (address _address, uint256 pointAmount) public onlyOwner {
        require(balanceOf(_address) >= pointAmount);
        _burn(_address, pointAmount);
    }

    // Option to allow for transfer for flexPoints between wallets Maybe for arbitrage purposes?
}

