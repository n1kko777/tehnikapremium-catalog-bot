const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeCurrency() {
  const url = `https://m.ifin.kz/exchange/uralsk/RUB`;
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  let results = Number(
    $(".list-row-cell.list-row-cell--value-sm.outdated").first().text().trim()
  );

  return isNaN(results) ? 5 : results;
}

module.exports = { scrapeCurrency };
