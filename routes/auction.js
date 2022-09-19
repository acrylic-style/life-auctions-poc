const router = require('express').Router()
const util = require('../src/util')

router.get('/auction/:id', async (req, res, next) => {
  const { id } = req.params
  if (!id) {
    res.status(400).json({success: false, message: 'Please specify name.'})
    return
  }
  const raw = await util.getAllAuctions(process.env.apiKey)
  const auction = raw.filter(auction => auction.store_id === parseInt(id, 10))[0]
  if (!auction) {
    res.status(404).json({success: false, message: 'Couldn\'t find auction!'})
    return
  }
  const auctionsName = raw.filter(a => util.stripColor(a.item_name) === util.stripColor(auction.item_name) && a.expires_at > (Date.now() - (1000*60*60*24*14)) && a.price > 0)
  let nameSum = 0
  const item = await util.getItemNBT(auction.item_bytes)
  auctionsName.forEach(a => nameSum += (a.price / item.Count.value))
  const itemName = auction.item_name || item.tag?.value?.display?.value?.Name?.value || item.id.value
  delete item.tag?.value?.ExtraAttributes
  res.render('auction', {
    data: {
      ...auction,
      item_data: item,
      display_name: itemName,
      stripped_display_name: util.stripColorCode(itemName),
      stripped_item_lore: util.stripColorCode(auction.item_lore || ''),
    },
    item_name: itemName,
    item_id: item.id.value,
    avgPrice: Math.round(nameSum/auctionsName.length),
  })
  next()
})

module.exports = router
