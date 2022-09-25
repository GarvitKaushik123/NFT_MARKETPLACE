// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    uint public tokenCount; 
    mapping(address => uint) public listOfSeller;

    constructor() ERC721("NFT", "NFT"){}
    function mint(string memory _tokenURI) external returns(uint) {
        listOfSeller[msg.sender] = listOfSeller[msg.sender]+1 ;
        tokenCount ++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        return(tokenCount);
    }
}