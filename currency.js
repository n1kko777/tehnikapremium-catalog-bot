const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeCurrency() {
  const url = `https://m.ifin.kz/exchange/uralsk/RUB`;
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  let results = Number(
    $(".list-row:not(.list-row--header) .list-row-cell.list-row-cell--value-sm")
      .first()
      .text()
      .trim()
  );

  return isNaN(results) || !results ? 5.1 : results;
}

module.exports = { scrapeCurrency };
