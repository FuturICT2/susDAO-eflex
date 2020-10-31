// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
// import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721Holder.sol";

// Basically, I need to create an ER721 token with the following functionality
// Mintable by holder smart contract (After claim approved by oracle)
// Burnable by holder smart contract once the end timestamp passes
// Pausable where the contract ownership transfer is paused 15 minutes before start of flex time
// Metadata must be able to change

// Todo:
// 1) Maybe I cannot transfer ownership like normal
// 2) Maybe I should only change the address in the struct
// 3) If we want ownership to change, then all the participants must give approval to contract before joining

contract Flex_Offer is ERC721, ERC721Burnable{
    string public memory_string;

    struct flex_offer_data {
        address og_owner;
        uint power;
        uint duration;
        uint start_time;
        uint end_time;
        uint curr_bid;
    }

    mapping (uint256 => flex_offer_data) public flex_offers_mapping;

    event flex_offer_minted (
        uint256 indexed flex_token_id
    );

    event flex_offer_bid_success(
        uint256 indexed flex_token_id
    );

    event flex_offer_bid_failed(
        uint256 indexed flex_token_id
    );


    event flex_offer_burned (
        uint256 indexed flex_offer_id
    );

    constructor() ERC721("Flex_Offer","FO") public {
        memory_string = "heyo";
    }

    function create_flex_offer_id ( address _address, uint timestamp ) internal returns (bytes32){
        return keccak256(abi.encodePacked(_address, timestamp));
    } 

    function _initiate_flex_offer_data(
        uint256 token_id,
        uint power,
        uint duration,
        uint start_time,
        uint end_time
    ) internal {
        require(_exists(token_id), "ERC721: asking data of nonexistent token");
        flex_offers_mapping[token_id] = flex_offer_data(_msgSender(),power,duration,start_time,end_time,0);
    }

    function mint_flex_offer_to(
        uint power,
        uint duration,
        uint start_time,
        uint end_time
    ) public returns (uint256){
        address _to = _msgSender();
        uint256 _flex_offer_id = uint256(create_flex_offer_id (_to,block.timestamp));
        _safeMint(_to,_flex_offer_id);
        _initiate_flex_offer_data(_flex_offer_id, power, duration, start_time, end_time);
        require(_exists(tokenId), "flex offer does not exist");
        emit flex_offer_minted(_flex_offer_id);
        return uint256(_flex_offer_id);
    }

    // This function assumes that the bidder address is doing the bidding
    // As long as the bidder bids a higher price than the curr bid,
    // And the flex offer is not expired then the bid ownership is transferred
    // Can be swapped out later
    function bid_for_flex_offer(uint256 flex_offer_id, uint bidder_bid, address bidder_address) public returns (string memory) {
        // address bidder_address =  _msgSender();
        uint curr_bid = flex_offers_mapping[flex_offer_id].curr_bid;
        // Check if expired and burn on expiry
        // Tokens expire 15 minutes before start of flex period
        if ((block.timestamp+900) > flex_offers_mapping[flex_offer_id].start_time){
            return "flex offer expired";
            // Todo
            // Add the issuing of coins to original owner
            // Should be paused and not burnt
            _burn(flex_offer_id);
        } else if (curr_bid < bidder_bid){
            _transfer(ownerOf(flex_offer_id), bidder_address, flex_offer_id);
            flex_offers_mapping[flex_offer_id].curr_bid = bidder_bid;
            flex_offer_owner_success(flex_offer_id);
            return "Bid Successful";
        }
        flex_offer_owner_failed(flex_offer_id);
        return "Bid Failed";
        // Create an event emitter
    }

}

