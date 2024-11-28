const { Op } = require("sequelize");
const { Product } = require("../../models");

function formatPrice(price) {
  return Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
    grouping: "thousands",
    groupSeparator: " ",
  }).format(price);
}

// Функция для создания сообщения с результатом поиска
function createSearchMessage(product) {
  const actualDate = new Date(product.date)
    .toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, ".");

  return `
<b>${product.title} (${product.article})</b>
<b>Категория:</b> ${product.category || "-"}

<b>Актуально на ${actualDate}:</b>
<b>Доставка:</b> ${product.delivery || "-"}
<b>Цена (опт):</b> ${
    product.priceRubOpt ? `${formatPrice(product.priceRubOpt)}` : "-"
  }

<a href="${product.link}">Подробнее</a>
  `;
}

const search = async (ctx) => {
  try {
    const searchText = ctx.message.text
      .replace("/search", "/s")
      .split("/s")[1]
      .trim();
    if (!searchText || searchText?.length < 3) {
      return ctx.reply("Введите текст для поиска от 3х символов: /s <текст>");
    }

    const count = await Product.count({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${searchText}%` } },
          { article: { [Op.iLike]: `%${searchText}%` } },
        ],
      },
    });

    const products = await Product.findAll({
      attributes: [
        "imgSrc",
        "title",
        "category",
        "priceRubOpt",
        "delivery",
        "article",
        "link",
        "date",
      ],
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${searchText}%` } },
          { article: { [Op.iLike]: `%${searchText}%` } },
        ],
      },
      offset: 0,
      limit: 3,
    });

    if (count === 0) {
      return ctx.reply("По вашему запросу ничего не найдено.");
    }

    let message = "";
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      message += createSearchMessage(product);
    }

    if (count > 3) {
      message += `\n\n<i>По вашему запросу найдено ${count} результатов. Показаны первые 3 результата. Уточните параметры запроса.</i>`;
    }

    await ctx.replyWithHTML(message);
  } catch (error) {
    console.error("Ошибка поиска:", error);
    ctx.reply("Произошла ошибка при поиске. Попробуйте позже.");
  }
};

module.exports = { search };
