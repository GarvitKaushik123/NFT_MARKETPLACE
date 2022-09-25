import { useEffect, useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'
// import { messagePrefix } from '@ethersproject/hash'
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')


const Create = ({ marketplace, nft, account }) => {
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // const [flag, setflag] = useState(false);
  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    if (typeof file !== 'undefined') {
      try {
        const result = await client.add(file)
        console.log(result)
        setImage(`https://ipfs.infura.io/ipfs/${result.path}`)
      } catch (error){
        console.log("ipfs image upload error: ", error)
      }
    }
  } 

  const checking  = async () => {
    let count = 0;
    const itemCount = await marketplace.itemCount()
    let items = []
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace.items(i)
      console.log("shirley setia")
      console.log(item.seller)
      console.log(account)
      if(item.seller.toLowerCase() == account){
        count++;
      }
    }

    return count;
  };

  const createNFT = async () => {
      let cnt;
      let count = await checking();
      console.log(count);
      if (!image || !price || !name || !description) return
      if(count>=3){
        alert("Can't mint more than 3 NFT");
        return;
      }
      try{
        const result = await client.add(JSON.stringify({image, price, name, description}))
        mintThenList(result)
      } catch(error) {
        console.log("ipfs uri upload error: ", error)
      }
    
  }

  const mintThenList = async (result) => {
    const uri = `https://ipfs.infura.io/ipfs/${result.path}`
    // mint nft 
    await(await nft.mint(uri)).wait()
    // get tokenId of new nft 
    const id = await nft.tokenCount()
    // approve marketplace to spend nft
    await(await nft.setApprovalForAll(marketplace.address, true)).wait()
    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await(await marketplace.makeItem(nft.address, id, listingPrice)).wait()
  }

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Mint and Sell NFT!
                </Button>
                <br></br>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create