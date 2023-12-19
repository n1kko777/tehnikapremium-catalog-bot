const axios = require("axios");
const cheerio = require("cheerio");
const xl = require("excel4node");
const fs = require("fs");

const { scrapeCurrency } = require("./currency");

function writeArrayToFile(array) {
  const data = JSON.stringify(array);
  fs.writeFile(`./files/data_${new Date().toISOString()}.json`, data, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Данные успешно записан в файл data.json");
  });
}

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

function getDeliveryByStatus(status) {
  if (status === "В наличии") {
    return "1 месяц";
  }

  if (status === "Ожидается поставка") {
    return "2 месяца";
  }

  return "более 2х месяцев";
}

async function updateItems(items) {
  const results = [];
  let index = 1;
  for (const item of items) {
    try {
      console.log(`${index}/${items.length}`);
      const { data } = await axios.get(item.linkKz);

      const $ = cheerio.load(data);

      const article =
        $(".product__article")?.text()?.replace("Артикул: ", "")?.trim() || "";

      if (article) {
        try {
          const { data: dataTeh } = await axios.get(
            `https://tehnikapremium.ru/catalog/?q=${article}&s=Найти`
          );
          const $ = cheerio.load(dataTeh);

          const link = $(".item_info--top_block a")?.attr("href")
            ? `https://tehnikapremium.ru${$(".item_info--top_block a")?.attr(
                "href"
              )}`
            : `https://tehnikapremium.ru/catalog/?q=${article}&s=Найти`;

          results.push({
            ...item,
            link,
          });
        } catch (error) {
          console.err(error);
        }
      } else {
        results.push(item);
      }

      await new Promise((r) => setTimeout(r, 100));
      index++;
    } catch (error) {
      console.err(error);
    }
  }

  return results;
}

async function scrapeSite() {
  const cur = (await scrapeCurrency()) ?? 5.1;

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

  const linksPromises = [];

  links.forEach((item) => {
    linksPromises.push(
      new Promise(async (resolve, reject) => {
        const { data } = await axios.get(item);
        resolve({ data, link: item });
      })
    );
  });

  const linksWithPages = [];

  await Promise.allSettled(linksPromises).then((resps) => {
    resps.forEach((res, index) => {
      if (res.status === "fulfilled") {
        const $ = cheerio.load(res.value.data);

        const catalogTitle =
          $(".catalog__header .catalog__title")?.text()?.split(" ")[1] || "0";
        const totalPages = Math.round(Number(catalogTitle) / 24);

        if (totalPages > 1) {
          Array.from(Array(totalPages), (_, indexAr) => {
            linksWithPages.push(`${res.value.link}?PAGEN_1=${indexAr + 1}`);
          });
        } else {
          linksWithPages.push(res.value.link);
        }
      }
    });
  });

  const itemsPromises = [];

  linksWithPages.forEach((item) => {
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
          const linkKz = $(elem).find(".snippet__category").attr("href");
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
          const delivery = getDeliveryByStatus(status);

          results.push({
            imgSrc: `https://shop.miele.kz${imgSrc}`,
            linkKz: `https://shop.miele.kz${linkKz}`,
            link: "",
            category,
            title,
            price,
            priceRubOpt,
            priceRubRozn,
            status,
            delivery,
            date: new Date().toISOString(),
          });
        });
      }
    });
  });

  const items = await updateItems(results);

  writeArrayToFile(items);

  const wb = new xl.Workbook();
  const ws = wb.addWorksheet("Лист 1");
  const headingColumnNames = [
    "Наименование",
    "Категория",
    "Опт цена в Руб",
    "Срок поставки",
    "Ссылка",
  ];

  let headingColumnIndex = 1;
  headingColumnNames.forEach((heading) => {
    ws.cell(1, headingColumnIndex++).string(heading);
  });

  let rowIndex = 2;
  items
    .map(({ title, category, priceRubOpt, delivery, link }) => ({
      title,
      category,
      priceRubOpt,
      delivery,
      link,
    }))
    .forEach((record) => {
      ws.cell(rowIndex, 1).string(record["title"]);
      ws.cell(rowIndex, 2).string(record["category"]);
      ws.cell(rowIndex, 3).number(record["priceRubOpt"]);
      ws.cell(rowIndex, 4).string(record["delivery"]);
      ws.cell(rowIndex, 5).link(record["link"]);
      rowIndex++;
    });

  wb.write(
    `./files/Прайс-лист Miele от ${new Date().toLocaleDateString("ru-RU")}.xlsx`
  );

  return `Всего товаров: ${items?.length || 0}`;
}

scrapeSite();

// module.exports = { scrapeSite };
