const fetch = require('node-fetch')
const BASE_URL = 'https://api-ktor.azisaba.net'
const cache = require('./cache')
require('./typedefs')
const nbt = require('prismarine-nbt')
const parsePromise = require('util').promisify(nbt.parse)

/**
 * Provides useful static methods.
 */
class Util {
  /**
   * @param {string} resource
   * @param {string} key API key generated in-game
   * @returns {Promise<any>} API Response
   */
  static async getAPI(resource, key, params = {}) {
    let param = ''
    Object.keys(params).forEach(key => {
      param = param + `&${key}=${params[key]}`
    })
    return await fetch(`${BASE_URL}/${resource}?_dummy${param}`, {
      headers: {
        Authorization: 'Bearer ' + key,
      },
    }).then(res => res.json())
  }

  /**
   * @param {string} key api key
   * @returns {Promise<Array<any>>}
   */
  static async getAllAuctions(key, bypassCache = false) {
    if (!bypassCache && cache.exists('auctions/all')) return cache.getCache('auctions/all')
    const auctions = await Util.getAPI('servers/life/auctions', key, { includeExpired: true })
    cache.setCache('auctions/all', auctions, 1000*60) // expires in a minute
    return auctions
  }

  static async getAllActiveAuctions(key) {
    const auctions = await this.getAllAuctions(key)
    return auctions.filter(a => a.expires_at > Date.now())
  }

  /**
   * @param {string} str 
   * @returns {string} string without color codes
   */
  static stripColor(str) {
    return str.replace(/[§]./gm, '')
  }

  /**
   * @param {string} data Base64 encoded nbt data
   * @returns {Promise<DecodedCompoundNBT>}
   */
  static async decodeNBT(data) {
    return await parsePromise(Buffer.from(data, 'base64'))
  }

  /**
   * @param {Date | number} date1
   * @param {Date | number} date2
   * @returns {string} date like 1d2h3m4s
   */
  static dateDiff(date1, date2) {
    const time = typeof date2 === 'number' ? date2-(typeof date1 === 'number' ? date1 : date1.getTime()) : date2.getTime()-(typeof date1 === 'number' ? date1 : date1.getTime())
    const days = Math.floor(time/(1000*60*60*24))
    const hours = Math.floor((time-(1000*60*60*24*days))/(1000*60*60))
    const minutes = Math.floor((time-(1000*60*60*24*days+1000*60*60*hours))/(1000*60))
    const seconds = Math.floor((time-(1000*60*60*24*days+1000*60*60*hours+1000*60*minutes))/1000)
    return `${days === 0 ? '': `${days}d`}${days === 0 && hours === 0 ? '' : `${hours}h`}${days === 0 && hours === 0 && minutes === 0 ? '' : `${minutes}m`}${seconds}s`
  }

  /**
   * @param {string} data
   * @returns {Promise<Item>}
   */
  static async getItemNBT(data) {
    return (await this.decodeNBT(data)).value
  }
  
  static stripColorCode(s) {
    s = s.replace(/\u00A70\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A71\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A72\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A73\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A74\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A75\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A76\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A77\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A78\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A79\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7a\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7b\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7c\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7d\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7e\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7f\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    // ---
    s = s.replace(/\u00A70(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A71(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A72(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A73(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A74(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A75(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A76(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A77(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A78(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A79(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7a(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7b(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7c(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7d(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7e(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7f(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7k(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7l(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7m(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7n(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7o(.*?)(?=\u00A7|\n|$)/gm, '$1')
    s = s.replace(/\u00A7r(.*?)(?=\u00A7|\n|$)/gm, '$1')
    return s
  }
}

module.exports = Util
