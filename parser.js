const axios = require("axios");
const cheerio = require("cheerio");
const xl = require("excel4node");
const fs = require("fs");

function roundNumberToThousands(num, curr = 5.05, proc = 0.05) {
  const currency = Math.round((curr * 100) / 10 + 0.5) / 10;

  const price = num / currency;
  let addedNum = price + price * proc;
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
          const priceRubOpt = roundNumberToThousands(price, cur, 0.05);
          const priceRubRozn = roundNumberToThousands(price, cur, 0.25);
          const status = $(elem).find(".snippet__status").text();

          results.push({
            imgSrc: `https://shop.miele.kz${imgSrc}`,
            link: `https://shop.miele.kz${link}`,
            category,
            title,
            price,
            priceRubOpt,
            priceRubRozn,
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
    "Опт цена в Руб",
    "Розн цена в Руб",
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
    .map(
      ({
        link,
        category,
        title,
        price,
        priceRubOpt,
        priceRubRozn,
        status,
      }) => ({
        title,
        category,
        priceRubOpt,
        priceRubRozn,
        price,
        status,
        link,
      })
    )
    .forEach((record) => {
      ws.cell(rowIndex, 1).string(record["title"]);
      ws.cell(rowIndex, 2).string(record["category"]);
      ws.cell(rowIndex, 3).number(record["priceRubOpt"]);
      ws.cell(rowIndex, 4).number(record["priceRubRozn"]);
      ws.cell(rowIndex, 5).number(record["price"]);
      ws.cell(rowIndex, 6).string(record["status"]);
      ws.cell(rowIndex, 7).link(record["link"]);
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
