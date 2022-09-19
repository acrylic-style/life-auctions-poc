const express = require('express')
const app = express()
const util = require('./src/util')
const routes = {
  api: require('./routes/api'),
  auctions: require('./routes/auctions'),
  auction: require('./routes/auction'),
}
const { LoggerFactory } = require('logger.js')
const logger = LoggerFactory.getLogger('main', 'blue')
require('dotenv-safe').config({ allowEmptyValues: true })
const env = process.env
app.set('view engine', 'ejs')
require('./src/typedefs')
const Cache = require('./src/cache')

app.get(/.*/, (req, res, next) => {
  logger.info(`Processing access to ${req.path} from ${req.ip}`)
  next()
})

app.get('/', async (req, res, next) => {
  if (Cache.exists('routes:/index')) {
    res.render('index', Cache.getCache('routes:/index'))
    next()
    return
  }
  logger.info('Rebuilding index!')
  const auctionsRaw = await util.getAllAuctions(env.apiKey)
  const auctions = await util.getAllActiveAuctions(env.apiKey)
  const auctionsFiltered = []
  /**
   * @type {{[name: string]: Auction[]}}
   */
  const auctionsMap = {}
  /**
   * @type {{[name: string]: Auction[]}}
   */
  const auctionsMapRaw = {}
  let allAuctions = {}
  for (let i = 0; i < auctions.length; i++) {
    const auction = auctions[i]
    const item = await util.getItemNBT(auction.item_bytes)
    const name = auction.item_name || item.tag?.value?.display?.value?.Name?.value || item.id.value
    if (!allAuctions[name]) allAuctions[name] = 0
    allAuctions[name] = allAuctions[name] + 1
    // temp
    if (!auctionsMap[name]) auctionsMap[name] = []
    auctionsMap[name].push(auction)
  }
  const auctionsSum = Object.values(allAuctions).reduce((a, b) => a + b)
  let sum = 0
  let highestPrice = 0
  let lowestPrice = Number.MAX_SAFE_INTEGER
  const keys = Object.keys(auctionsMap)
  for (let oi = 0; oi < keys.length; oi++) {
    const key = keys[oi]
    if (auctionsMap[key].length !== 0) {
      for (let i = 0; i < auctionsMap[key].length; i++) {
        const auction = auctionsMap[key][i]
        const item = await util.getItemNBT(auction.item_bytes)
        const item_amount = item.Count.value
        const price = Math.round(auction.price/item_amount)
        if (auctionsMap[key].filter(auction => (auction.end-Date.now()) <= 1000*60*10).length === 0 || (auction.end-Date.now()) <= 1000*60*10) sum += price
        if (highestPrice < price) highestPrice = price
        if (lowestPrice > price && price > 0) lowestPrice = price
      }
      auctionsFiltered.push({
        displayName: key,
        sellPrice: Math.round(sum/auctionsMap[key].filter(auction => auctionsMap[key].filter(auction => (auction.end-Date.now()) <= 1000*60*10).length === 0 || (auction.end-Date.now()) <= 1000*60*10).length),
        highestPrice,
        lowestPrice,
        auctions: allAuctions[key],
      })
    }
    sum = 0
    highestPrice = 0
    lowestPrice = Number.MAX_SAFE_INTEGER
  }
  const auctions2 = []
  allAuctions = {}
  for (let i = 0; i < auctionsRaw.length; i++) {
    const auction = auctionsRaw[i]
    const item = await util.getItemNBT(auction.item_bytes)
    const name = auction.item_name || item.tag?.value?.display?.value?.Name?.value || item.id.value
    if (!allAuctions[name]) allAuctions[name] = 0
    allAuctions[name] = allAuctions[name] + 1
    if (auctionsMapRaw[name] == null) auctionsMapRaw[name] = []
    auctionsMapRaw[name].push(auction)
  }
  const keys2 = Object.keys(auctionsMapRaw)
  for (let oi = 0; oi < keys2.length; oi++) {
    const key = keys2[oi]
    if (auctionsMapRaw[key].length !== 0) {
      for (let i = 0; i < auctionsMapRaw[key].length; i++) {
        const auction = auctionsMapRaw[key][i]
        const item = await util.getItemNBT(auction.item_bytes)
        const item_amount = item.Count.value
        const price = Math.round(auction.price/item_amount)
        if (auctionsMapRaw[key].filter(auction => (auction.expires_at-Date.now()) <= 1000*60*10).length === 0 || (auction.expires_at-Date.now()) <= 1000*60*10) sum += price
        if (highestPrice < price) highestPrice = price
        if (lowestPrice > price && price > 0) lowestPrice = price
      }
      if (lowestPrice < Number.MAX_SAFE_INTEGER && highestPrice > 0 && sum > 0) {
        auctions2.push({
          displayName: key,
          sellPrice: Math.round(sum/auctionsMapRaw[key].filter(auction => auctionsMapRaw[key].filter(auction => (auction.expires_at-Date.now()) <= 1000*60*10).length === 0 || (auction.expires_at-Date.now()) <= 1000*60*10).length),
          highestPrice,
          lowestPrice,
          auctions: allAuctions[key],
        })
      }
    }
    sum = 0
    highestPrice = 0
    lowestPrice = Number.MAX_SAFE_INTEGER
  }
  const data = {
    auctions: auctionsFiltered.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    auctionsRaw: auctions2.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    auctionsCount: auctionsSum,
    auctionsRawCount: Object.values(allAuctions).reduce((a, b) => a + b),
  }
  data.stringAuctions = JSON.stringify(data.auctions)
  data.stringAuctionsRaw = JSON.stringify(data.auctionsRaw)
  Cache.setCache('routes:/index', data, 1000*60) // expires in a minute
  res.render('index', data)
  next()
})

app.use('/api', routes.api)

app.use('/', routes.auctions)
app.use('/', routes.auction)

app.get(/.*/, (req, res, next) => {
  logger.info(`Access to ${req.path} from ${req.ip} has been completed.`)
  next()
})

logger.info('Loading cache...')
Cache.getCacheData().then(data => {
  logger.info(`Loaded cache. (${Math.round(JSON.stringify(data).length/1024/1024*100)/100}MB, ${Object.keys(data).length} entries)`)
  process.emit('loadedConfig')
})

setInterval(async () => {
  await Cache.save()
}, 1000*60) // save config every 60 seconds

const exitHandler = async () => {
  logger.info('Writing cache to the disk... (Press CTRL+C again to quit)')
  await Cache.save()
  process.kill(process.pid, 'SIGINT')
}

process.once('SIGINT', exitHandler)
process.once('SIGQUIT', exitHandler)
process.once('SIGTSTP', exitHandler)

process.on('SIGUSR2', async () => {
  logger.info('Received SIGUSR2, writing cache to the disk!')
  await Cache.save()
  logger.info('Done!')
})

process.once('loadedConfig', () => {
  app.listen(env.listenPort, () => {
    logger.info('Web server has been started and ready to go.')
  })
})
