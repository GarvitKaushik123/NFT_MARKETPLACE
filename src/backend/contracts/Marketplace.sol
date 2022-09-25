// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard {

    // Variables
    address payable public immutable feeAccount; // the account that receives fees
    uint public immutable feePercent; // the fee percentage on price recieved
    uint public itemCount; 
    uint public biditemcount;

    struct Item {
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable seller;
        bool sold;
    }

    struct bidItem{
        uint biditemId;
        IERC721 nft;
        uint tokenId;
        uint baseprice;
        address payable beneficiary;
        bool sold;
        uint auctionEndTime;
        address highestBidder;
        uint highestBid;
    }

    mapping(uint => Item) public items;
    mapping(uint => bidItem) public biditems;

    event Offered(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller
    );
    event Bought(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );

    constructor(uint _feePercent) {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    // Make item to offer on the marketplace
    function makeItem(IERC721 _nft, uint _tokenId, uint _price) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        itemCount ++;
        // transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        // add new item to items mapping
        items[itemCount] = Item (
            itemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false
        );
        // emit Offered event
        emit Offered(
            itemCount,
            address(_nft),
            _tokenId,
            _price,
            msg.sender
        );
    }

    function purchaseItem(uint _itemId) external payable nonReentrant {
        uint _totalPrice = getTotalPrice(_itemId);
        Item storage item = items[_itemId];
        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
        require(msg.value >= _totalPrice, "not enough ether to cover item price and market fee");
        require(!item.sold, "item already sold");
        // pay seller and feeAccount
        item.seller.transfer(item.price);
        feeAccount.transfer(_totalPrice - item.price);
        // update item to sold
        item.sold = true;
        // transfer nft to buyer
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);
        // emit Bought event
        emit Bought(
            _itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            msg.sender
        );
    }

        function purchaseBidItem(uint _biditemId) external payable nonReentrant {
        bidItem storage biditem = biditems[_biditemId];
        require(_biditemId > 0 && _biditemId <= biditemcount, "item doesn't exist");        
        require(!biditem.sold,"NFT already sold");
        if(biditem.auctionEndTime < block.timestamp){
            biditem.sold = true;
            if(biditem.highestBidder == 0x0000000000000000000000000000000000000000){
                //do nothing
                //it has an issue that if the NFT is not 
                //sold then we earn nothing 
            }else{
                 //bid time ends
                 biditem.beneficiary.send(biditem.highestBid-1);
                 feeAccount.send(1);
                 biditem.nft.transferFrom(address(this),biditem.highestBidder,biditem.tokenId);
            }
        }else{
        //bidding in progress
        payable(biditem.highestBidder).send(biditem.highestBid);
        biditem.highestBidder = msg.sender;
        biditem.highestBid = msg.value * 1000000000000000000;
        }
      
    }
    
    
    function getTotalPrice(uint _itemId) view public returns(uint){
        return((items[_itemId].price*(100 + feePercent))/100);
    }

    //bidding functions 

    function makeBidItem(IERC721 _nft, uint _tokenId, uint _price, uint _auctiontime) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
         biditemcount++;
        // transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        // add new item to biditems mapping
        biditems[biditemcount] = bidItem (
            biditemcount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false,
            _auctiontime+block.timestamp ,
            0x0000000000000000000000000000000000000000,
            _price
        );

        }

}

