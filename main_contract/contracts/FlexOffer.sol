// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

import "./FlexPoint.sol";

// Basically, I need to create an ER721 token with the following functionality
// Mintable by holder smart contract (After claim approved by oracle)
// Burnable by holder smart contract once the end timestamp passes
// Pausable where the contract ownership transfer is paused 15 minutes before start of flex time
// Metadata must be able to change

// Todo:
// 1) Maybe I cannot transfer ownership like normal
// 2) Maybe I should only change the address in the struct
// 3) If we want ownership to change, then all the participants must give approval to contract before joining


contract FlexOffer is ERC721, ERC721Burnable{
    string public memory_string;
    FlexPoint public FP;
    uint256 internal flexOfferCount;
    uint internal offerTimeBuffer;
    uint internal bidTimeBuffer;

    struct flex_offer_data {
        address og_owner;
        uint power;
        uint duration;
        uint start_time;
        uint end_time;
        uint curr_bid;
    }

    // mapping thats links an address to the list of flex offers they have created
    mapping(address => uint256[]) public flexOfferMintMapping;

    mapping (uint256 => flex_offer_data) public flex_offers_mapping;

    event flexOfferMinted (uint256 indexed flexOfferId, address indexed og_owner);

    event flexOfferBidSuccess(uint256 indexed flexOfferId, address indexed new_owner, uint bid_amount);

    event flexOfferActivation(uint256 indexed flexOfferId,uint256 flexPointCalc, address indexed curr_owner);

    event ethForFlexPoint(address indexed _address, uint ethAmount, uint pointAmount, address indexed curr_owner);

    // event flex_offer_bid_failed(uint256 indexed flexTokenId);

    // event flex_offer_burned (uint256 indexed flexOfferId);

    constructor() ERC721("Flex_Offer","FO") public {
        memory_string = "heyo";
        FP = new FlexPoint();
        flexOfferCount = 0;
        bidTimeBuffer = 10;
        offerTimeBuffer = 60; 
    }

    function GetMyTotMintedFlexOffers(address _address) public returns(uint256){
        return uint256(flexOfferMintMapping[_address].length);
    }
    
    function GetMyFlexOffer(address _address, uint256 i) public returns(uint256){
        return uint256(flexOfferMintMapping[_address][i]);
    }

    function CalFlexPointIssue(uint256 flexOfferId) internal view returns (uint256){
        uint start = flex_offers_mapping[flexOfferId].start_time;
        uint end = flex_offers_mapping[flexOfferId].end_time;
        uint dur = flex_offers_mapping[flexOfferId].duration;
        uint pow = flex_offers_mapping[flexOfferId].power;
        return ((end-start-dur)/(end-start))*(dur)*(pow);
    }
    // include a incrementing counter
    function create_flex_offer_id ( address _address, uint timestamp ) internal pure returns (bytes32){
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
        // uint256 _flex_offer_id = uint256(create_flex_offer_id (_msgSender(),block.timestamp));
        // require for the start_time to be later than the offer time buffer
        require(block.timestamp+offerTimeBuffer < start_time, "start time too close to offer time. Does not allow time for bidders to bid");
        uint256 _flex_offer_id = flexOfferCount; 
        flexOfferMintMapping[_msgSender()].push(_flex_offer_id);
        _safeMint(_msgSender(),_flex_offer_id);
        _initiate_flex_offer_data(_flex_offer_id, power, duration, start_time, end_time);
        require(_exists(_flex_offer_id), "flex offer does not exist");
        flexOfferCount = flexOfferCount + 1;
        emit flexOfferMinted(_flex_offer_id, _msgSender());
        return uint256(_flex_offer_id);
    }

    function BidForFlexOffer(uint256 flexOfferId) public payable{
        // Current highest bid for the flex offer
        uint currBid = flex_offers_mapping[flexOfferId].curr_bid;
        // Require that the bid is within the bid window
        require(
            (block.timestamp+bidTimeBuffer) < flex_offers_mapping[flexOfferId].start_time,
            "Flex Offer is no longer biddable"
        );
        require(
            msg.value > currBid,
            "Current bid is higher than your bid"
        );
        payable(ownerOf(flexOfferId)).transfer(flex_offers_mapping[flexOfferId].curr_bid);
        _transfer(ownerOf(flexOfferId), _msgSender(), flexOfferId);
        flex_offers_mapping[flexOfferId].curr_bid = msg.value;
        emit flexOfferBidSuccess(flexOfferId, _msgSender(), msg.value);
    }

    // the activation of the flex offer also burns the flex offer
    // Need to add the reward mechanism here 
    function ActivateFlexOffer(uint256 flexOfferId)public{
        require(_msgSender() == ownerOf(flexOfferId),'Only owner of flex offer can activate');
        // can only activate after start time
        require(block.timestamp > flex_offers_mapping[flexOfferId].start_time,'Start time not yet reached');
        // Must be activated before the end time - duration requirement
        require(block.timestamp < flex_offers_mapping[flexOfferId].end_time-flex_offers_mapping[flexOfferId].duration,'End time passed');
        uint256 flexPointCalc = CalFlexPointIssue(flexOfferId);
        FP.IssueFlexPoint( flex_offers_mapping[flexOfferId].og_owner, flexPointCalc);
        _burn(flexOfferId);
        emit flexOfferActivation(flexOfferId ,flexPointCalc, _msgSender());
    }

    // Fallback activation if
    // 1) There was no buyer
    // 2) The buyer did not end up activating
    // 3) The end time - duration has passed
    // Note: This means that the owner cannot terminate the flex offer on his own
    // We can add this functionality later
    function EndTimeActivate(uint256 flexOfferId) public {
        require (_msgSender() == flex_offers_mapping[flexOfferId].og_owner,'account not original owner');
        require (block.timestamp > (flex_offers_mapping[flexOfferId].end_time - flex_offers_mapping[flexOfferId].duration),'end time for sold offer not yet pass');
        uint256 flexPointCalc = CalFlexPointIssue(flexOfferId);
        FP.IssueFlexPoint( flex_offers_mapping[flexOfferId].og_owner, flexPointCalc);
        _burn(flexOfferId);
        emit flexOfferActivation(flexOfferId ,flexPointCalc, _msgSender());
        // emit flex_offer_burned (flexOfferId);
    }


    // function to claim ETH with FlexPoints
    function ClaimEthWithFlexPoint(uint pointAmount) public {
        uint flexPointSupply = FP.totalSupply();
        uint ethBalance = address(this).balance;
        uint ethAmount = (pointAmount*ethBalance)/flexPointSupply;
        FP.ClaimFlexPoints (_msgSender(), pointAmount);
        require(_msgSender().send(ethAmount));
        emit ethForFlexPoint(_msgSender(), ethAmount, pointAmount, _msgSender());
    }


}