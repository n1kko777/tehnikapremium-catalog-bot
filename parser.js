const axios = require("axios");
const cheerio = require("cheerio");
const xl = require("excel4node");
const fs = require("fs");

function roundNumberToThousands(num, curr = 5.05) {
  const currency = Math.round((curr * 100) / 10 + 0.5) / 10;

  const price = num / currency;
  let addedNum = price + price * 0.05;
  let roundedNumber = Math.round(addedNum / 100) * 100;
  return roundedNumber;
}

function getAllLinks(data) {
  let links = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].subItems) {
      for (let j = 0; j < data[i].subItems.length; j++) {
        links.push(data[i].subItems[j].link);
      }
    }
  }
  return links;
}

async function scrapeSite(cur = 5.1) {
  const url = `https://shop.miele.kz/catalog/`;

  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const results = [];
  const categories = [];

  $(".catalog-sections .catalog-sections__item").each((i, elem) => {
    const link = $(elem).find("a.catalog-sections__preview").attr("href");
    const title = $(elem).find("a.catalog-sections__preview").attr("title");

    categories.push({
      link: `https://shop.miele.kz${link}`,
      title,
      subItems: [],
    });
  });

  const subCategoriesPromises = [];

  categories.forEach((item) => {
    subCategoriesPromises.push(
      new Promise(async (resolve, reject) => {
        const { data } = await axios.get(item.link);
        resolve(data);
      })
    );
  });

  await Promise.allSettled(subCategoriesPromises).then((resps) => {
    resps.forEach((res, index) => {
      if (res.status === "fulfilled") {
        const $ = cheerio.load(res.value);

        $(".catalog-sections .catalog-sections__item").each((i, elem) => {
          const link = $(elem).find("a.catalog-sections__preview").attr("href");
          const title = $(elem)
            .find("a.catalog-sections__preview")
            .attr("title");

          categories[index].subItems.push({
            link: `https://shop.miele.kz${link}`,
            title,
          });
        });
      }
    });
  });

  let links = getAllLinks(categories);

  const itemsPromises = [];

  links.forEach((item) => {
    itemsPromises.push(
      new Promise(async (resolve, reject) => {
        const { data } = await axios.get(item);
        resolve(data);
      })
    );
  });

  await Promise.allSettled(itemsPromises).then((resps) => {
    resps.forEach((res, index) => {
      if (res.status === "fulfilled") {
        const $ = cheerio.load(res.value);

        $(".catalog-list .snippet").each((i, elem) => {
          const imgSrc = $(elem).find("img").attr("src");
          const link = $(elem).find(".snippet__category").attr("href");
          const category = $(elem).find(".snippet__category").text();
          const title = $(elem).find(".snippet__title").text();
          const price =
            Number(
              $(elem)
                .find(".snippet__price")
                ?.text()
                ?.replace("₸", "")
                ?.trim()
                ?.replace(/\s/g, "")
            ) ?? 0;
          const priceRub = roundNumberToThousands(price, cur);
          const status = $(elem).find(".snippet__status").text();

          results.push({
            imgSrc: `https://shop.miele.kz${imgSrc}`,
            link: `https://shop.miele.kz${link}`,
            category,
            title,
            price,
            priceRub,
            status,
            date: new Date().toISOString(),
          });
        });
      }
    });
  });

  const wb = new xl.Workbook();
  const ws = wb.addWorksheet("Лист 1");
  const headingColumnNames = [
    "Наименование",
    "Категория",
    "Цена в Руб",
    "Цена в Тенге",
    "Статус",
    "Ссылка",
  ];

  let headingColumnIndex = 1;
  headingColumnNames.forEach((heading) => {
    ws.cell(1, headingColumnIndex++).string(heading);
  });

  let rowIndex = 2;
  results
    .map(({ link, category, title, price, priceRub, status }) => ({
      title,
      category,
      price: price?.toString() || "",
      priceRub: priceRub?.toString() || "",
      status,
      link,
    }))
    .forEach((record) => {
      let columnIndex = 1;
      Object.keys(record).forEach((columnName) => {
        ws.cell(rowIndex, columnIndex++).string(record[columnName]);
      });
      rowIndex++;
    });

  wb.write(
    `./files/Прайс-лист Miele от ${new Date().toLocaleDateString(
      "ru-RU"
    )} (курс: ${cur}).xlsx`
  );

  return results;
}

module.exports = { scrapeSite };
