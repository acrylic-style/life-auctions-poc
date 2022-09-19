const router = require('express').Router()
const util = require('../src/util')

router.get('/auctions/:name', async (req, res, next) => {
  const { name } = req.params
  if (!name) {
    res.status(400).json({success: false, message: 'Please specify name.'})
    return
  }
  const auctionsRaw = (await util.getAllAuctions(process.env.apiKey)).filter(auction => util.stripColor(auction.item_name) === name)
  const auctions = (await util.getAllActiveAuctions(process.env.apiKey)).filter(auction => util.stripColor(auction.item_name) === name)
  const auctionsFiltered = []
  let allAuctions = auctions.length
  const finalAllAuctions = allAuctions
  for (let i = 0; i < auctions.length; i++) {
    const auction = auctions[i]
    const item = await util.getItemNBT(auction.item_bytes)
    const item_amount = item.Count.value
    const coloredName = auction.item_name || item.tag?.value?.display?.value?.Name?.value || item.id.value
    auctionsFiltered.push({
      coloredName: `${coloredName} \u00A77(x${item_amount})`,
      displayName: `${auction.item_name} (x${item_amount})`,
      storeId: auction.store_id,
      price: auction.price,
      end: auction.expires_at < Date.now() ? 'N/A' : util.dateDiff(Date.now(), auction.expires_at),
    })
  }
  const auctions2 = []
  allAuctions = auctionsRaw.length
  for (let i = 0; i < auctionsRaw.length; i++) {
    const auction = auctionsRaw[i]
    const item = await util.getItemNBT(auction.item_bytes)
    const item_amount = item.Count.value
    const coloredName = auction.item_name || item.tag?.value?.display?.value?.Name?.value || item.id.value
    auctions2.push({
      coloredName: `${coloredName} \u00A77(x${item_amount})`,
      displayName: `${auction.item_name} (x${item_amount})`,
      storeId: auction.store_id,
      price: auction.price,
      end: auction.end < Date.now() ? 'N/A' : util.dateDiff(Date.now(), auction.expires_at),
    })
  }
  res.render('auctions', {
    auctions: auctionsFiltered,
    auctionsRaw: auctions2,
    auctionsCount: finalAllAuctions,
    auctionsRawCount: allAuctions,
    stringAuctions: JSON.stringify(auctionsFiltered),
    stringAuctionsRaw: JSON.stringify(auctions2),
    name,
  })
  next()
})

module.exports = router
