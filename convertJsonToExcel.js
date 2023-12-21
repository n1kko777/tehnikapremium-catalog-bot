const xl = require("excel4node");

function convertJsonToExcel(items) {
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

  ws.column(1).setWidth(25).freeze(1);
  ws.column(2).setWidth(20);
  ws.column(3).setWidth(15);

  const verticalAlignStyle = {
    alignment: {
      vertical: "center",
    },
  };

  const numberStyle = {
    numberFormat: "### ### ##0; (### ### ##0); -",
  };

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
      ws.cell(rowIndex, 1).string(record["title"]).style(verticalAlignStyle);
      ws.cell(rowIndex, 2)
        .string(record["category"])
        .style({
          alignment: {
            wrapText: true,
            horizontal: "center",
          },
        });
      ws.cell(rowIndex, 3)
        .number(record["priceRubOpt"])
        .style(numberStyle)
        .style(verticalAlignStyle);
      ws.cell(rowIndex, 4)
        .string(record["delivery"])
        .style({
          alignment: {
            wrapText: true,
            horizontal: "center",
          },
        });
      ws.cell(rowIndex, 5).link(record["link"]).style(verticalAlignStyle);
      rowIndex++;
    });

  wb.write(
    `./files/Прайс-лист Miele от ${new Date().toLocaleDateString("ru-RU")}.xlsx`
  );
}

module.exports = { convertJsonToExcel };
