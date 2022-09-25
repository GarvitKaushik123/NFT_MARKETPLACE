import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Button } from 'react-bootstrap'
import { Form } from 'react-bootstrap'
const BigNumber = require('bignumber.js');

const Bid = ({ marketplace, nft }) => {
  const [loading, setLoading] = useState(true)
  const [biditems, setbiditems] = useState([])
  const [bidprice, setbidPrice] = useState(null)
  const [errobj, seterrobj] = useState(null)
  const [err, seterr] = useState(false)
  const loadMarketplaceItems = async () => {
    // Load all unsold items
    const biditemcount = await marketplace.biditemcount()
    let biditems = []
    for (let i = 1; i <= biditemcount; i++) {
      const biditem = await marketplace.biditems(i)
      if (!biditem.sold) {
        // get uri url from nft contract
        const uri = await nft.tokenURI(biditem.tokenId)
        // use uri to fetch the nft metadata stored on ipfs 
        const response = await fetch(uri)
        const metadata = await response.json()
        // get total price of item (item price + fee)
        const totalPrice = (biditem.highestBid)
        //date
        var showdate = new Date((biditem.auctionEndTime)*1000+33*60*1000);
        var enddate = showdate.getDate()+'/'+(showdate.getMonth()+1)+'/'+showdate.getFullYear() + '(' + showdate.getHours()+ ':'+ showdate.getSeconds()+')';
        // Add item to items array
        biditems.push({
          itemId: biditem.biditemId,
          seller: biditem.beneficiary,
          price: ethers.utils.formatEther(biditem.highestBid),
          highestbidder: biditem.highestBidder,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          endtime: enddate
        })
      }
    }
    setLoading(false)
    setbiditems(biditems)
  }

const bidNFT = async (biditem) => {
    if((bidprice)<=parseInt(biditem.price)){
      console.log("Please enter a value greater than highest bid");
      seterr(true);
      seterrobj(biditem.itemId);
    }else{
      await (await marketplace.purchaseBidItem(biditem.itemId, { value: bidprice })).wait()
      loadMarketplaceItems() 
    }
  }


  useEffect(() => {
    loadMarketplaceItems()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {biditems.length > 0 ?
        <div className="px-5 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {biditems.map((biditem, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={biditem.image} />
                  <Card.Body color="secondary">
                    <Card.Title>{biditem.name}</Card.Title>
                    <Card.Text>
                      {biditem.description}
                      </Card.Text>
                    <Card.Text>
                      Highest bid : {biditem.price} ETH
                    </Card.Text>
                    <Card.Text>
                      End Time : {biditem.endtime}
                    </Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <div className='d-grid'>
                      <Form.Control onChange={(e) =>{seterr(false);setbidPrice(e.target.value);biditem.totalPrice = e.target.value;} } size="lg" required type="number" placeholder="Price in ETH" />
                      {err && biditem.itemId==errobj ?
                      <div>Please enter a value greater than highest bid</div>:<div></div>}
                      <div className="d-grid px-0">
                        <br></br>
                <Button onClick={()=>{bidNFT(biditem)}} variant="primary" size="lg">
                   Bid
                </Button>
              </div>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No listed assets</h2>
          </main>
        )}
    </div>
  );
}
export default Bid

