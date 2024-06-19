const {
  parsePublicLinkYaDisk,
  getUrlForDownload,
  downloadFileByUrl,
} = require("@owlagency/yadisk");
const AdmZip = require("adm-zip");
const dotenv = require("dotenv");

const fs = require("fs");
const path = require("path");

dotenv.config();

const savePath = __dirname + "/files/temp";
const pricesPath = __dirname + "/files/prices";
const catalogsPath = __dirname + "/files/catalogs";

const clearDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    console.error(`Directory does not exist: ${dir}`);
    return;
  }

  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err}`);
      return;
    }

    files
      .filter((file) => file.includes("."))
      .forEach((file) => {
        const filePath = path.join(dir, file);

        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file ${file}: ${err}`);
          } else {
            console.log(`Deleted file: ${file}`);
          }
        });
      });
  });
};

const moveFiles = (sourceDir, destDir) => {
  // Проверяем, существует ли исходная и целевая директории
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    return;
  }

  if (!fs.existsSync(destDir)) {
    console.error(`Destination directory does not exist: ${destDir}`);
    return;
  }

  // Читаем содержимое исходной директории
  fs.readdir(sourceDir, (err, files) => {
    if (err) {
      console.error(`Error reading source directory: ${err}`);
      return;
    }

    files.forEach((file) => {
      const sourceFile = path.join(sourceDir, file);
      const destFile = path.join(destDir, file);

      // Перемещаем файл
      fs.rename(sourceFile, destFile, (err) => {
        if (err) {
          console.error(`Error moving file ${file}: ${err}`);
        } else {
          console.log(`Moved file: ${file}`);
        }
      });
    });
  });
};

async function yadisk(onReply) {
  try {
    const yaLink = process.env.DISK_URL;
    const downloadFileName = await downloadAllByYaLink(yaLink);

    const zip = new AdmZip(`${savePath}/${downloadFileName}`);
    zip.extractAllTo(savePath);

    clearDirectory(pricesPath);
    clearDirectory(catalogsPath);

    setTimeout(() => {
      moveFiles(`${savePath}/tehnikapremium-catalog-bot/prices`, pricesPath);
      moveFiles(
        `${savePath}/tehnikapremium-catalog-bot/catalogs`,
        catalogsPath
      );
    }, 1000);

    setTimeout(() => {
      clearDirectory(savePath);
    }, 3000);

    onReply("Файлы обновлены успешно!");
  } catch (error) {
    console.error("Ошибка:", error);
    onReply("Произошла ошибка: " + error.message);
  }
}

async function downloadAllByYaLink(yaLink) {
  const partsPublicUrl = parsePublicLinkYaDisk(yaLink);

  try {
    const downloadHref = await getUrlForDownload(partsPublicUrl.downloadLink);

    try {
      const filename = await downloadFileByUrl(downloadHref, `${savePath}/`);
      return filename;
    } catch (error) {
      console.error("Ошибка:", error);
      onReply("Произошла ошибка: " + error.message);
    }
  } catch (error) {
    console.error("Ошибка:", error);
    onReply("Произошла ошибка: " + error.message);
  }
}

module.exports = { yadisk };
