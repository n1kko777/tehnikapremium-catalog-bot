const { parentPort } = require("worker_threads");
const axios = require("axios");
const https = require("https");
const cheerio = require("cheerio");
const dotenv = require("dotenv");

dotenv.config();

const { Product } = require("./models");

const { scrapeCurrency } = require("./currency");
const { convertJsonToExcel } = require("./convertJsonToExcel");

// At request level
const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

axios.defaults.timeout = 45000;
axios.defaults.httpsAgent = agent;

const OPT_PERCENT = Number(process.env.OPT_PERCENT) || 0.1;
const ROZN_PERCENT = Number(process.env.ROZN_PERCENT) || 0.3;
const isOldFilter = process.env.IS_OLD_FILTER ?? 1;

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

function extractNumberFromString(inputString) {
  // Используем регулярное выражение для поиска одного или более цифр
  const regex = /\d+/g;
  let match;

  // Проходим по всем найденным совпадениям
  while ((match = regex.exec(inputString)) !== null) {
    // Возвращаем первое найденное число
    return parseInt(match[0], 10);
  }
}

async function writeArrayToDb(dataArray) {
  try {
    for (let data of dataArray) {
      const existingRecord = await Product.findOne({
        where: { article: data.article },
      });

      if (!existingRecord) {
        await Product.create(data);
      } else {
        const shouldUpdate = Object.keys(data).some((key) => {
          return (
            key !== "article" &&
            key !== "date" &&
            existingRecord[key] !== data[key]
          ); // Исключаем поля article и date из сравнения
        });

        if (shouldUpdate) {
          await Product.update(data, { where: { article: data.article } });
        }
      }
    }
  } catch (error) {
    console.error(`Error processing:`, error);
  }
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

  return Boolean(isOldFilter) ? "" : "более 2х месяцев";
}

async function updateItems(items) {
  const results = [];

  for (const item of items) {
    try {
      const { data } = await fetchWithRetry(item.linkKz);

      const $ = cheerio.load(data);

      const articleText = $(".product__article")?.text();
      const article = articleText?.split(":")[1]?.trim() || "";

      if (article) {
        const updatedItem = { ...item };
        try {
          const { data: dataTeh } = await fetchWithRetry(
            `https://tehnikapremium.ru/catalog/?q=${article}&s=Найти`
          );
          const $ = cheerio.load(dataTeh);

          const link = $(".item_info--top_block a")?.attr("href")
            ? `https://tehnikapremium.ru${$(".item_info--top_block a")?.attr(
                "href"
              )}`
            : `https://tehnikapremium.ru/catalog/?q=${article}&s=Найти`;

          updatedItem.link = link;
          updatedItem.article = article;
        } catch (error) {
          console.error(error);
        } finally {
          results.push(updatedItem);
        }
      } else {
        results.push(item);
      }

      await new Promise((r) => setTimeout(r, 150));
    } catch (error) {
      console.error(error);
    }
  }

  return results;
}

async function updateCatalog(items) {
  const results = [];
  const cur = (await scrapeCurrency()) ?? 5.1;

  for (const item of items) {
    try {
      const { data } = await fetchWithRetry(item);
      const $ = cheerio.load(data);

      $(".catalog-list .snippet").each((i, elem) => {
        const imgSrc = $(elem).find("img").attr("src");
        const linkKz = $(elem).find(".snippet__category").attr("href");
        const category = $(elem).find(".snippet__category").text();
        const title = $(elem).find(".snippet__title").text();
        const price =
          Number(
            $(elem)
              .find(".snippet__price-value")
              ?.text()
              ?.replace("₸", "")
              ?.trim()
              ?.replace(/\s/g, "")
          ) ?? 0;
        const status = $(elem).find(".snippet__status").text();
        const delivery = getDeliveryByStatus(status);

        if (!delivery || Number.isNaN(price)) return;

        const priceRubOpt = roundNumberToThousands(price, cur, OPT_PERCENT);
        const priceRubRozn = roundNumberToThousands(price, cur, ROZN_PERCENT);

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

      await new Promise((r) => setTimeout(r, 50));
    } catch (error) {
      console.error(error);
    }
  }

  return results;
}

async function scrapeSite() {
  const url = `https://shop.miele.kz/catalog/`;

  const { data } = await fetchWithRetry(url);
  const $ = cheerio.load(data);

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
        const { data } = await fetchWithRetry(item.link);
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
        const { data } = await fetchWithRetry(item);
        resolve({ data, link: item });
      })
    );
  });

  const linksWithPages = [];

  await Promise.allSettled(linksPromises).then((resps) => {
    resps.forEach((res, index) => {
      if (res.status === "fulfilled") {
        const $ = cheerio.load(res.value.data);

        const catalogText =
          $(".catalog__header .catalog__title")?.text() || "0";

        const catalogTitle = extractNumberFromString(catalogText);

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

  const itemsPromises = await updateCatalog(linksWithPages);

  const items = await updateItems(itemsPromises);

  if (items?.length > 0) {
    writeArrayToDb(items);
    convertJsonToExcel(items);

    if (parentPort) {
      parentPort.postMessage(`Всего товаров: ${items?.length || 0}`);
    }
    return;
  }

  if (parentPort) {
    parentPort.postMessage(`Не удалось обновить прайс`);
  }
}

scrapeSite();
