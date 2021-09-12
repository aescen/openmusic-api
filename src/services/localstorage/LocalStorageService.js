const fs = require('fs');
const Path = require('path');

class LocalStorageService {
  constructor(folder = Path.resolve(process.cwd(), 'src/api/uploads/files/pictures')) {
    this._folder = folder;
    console.log(folder);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeFile(file, meta) {
    const fileName = `${+new Date()}_-_${meta.filename}`;
    const path = `${this._folder}/${fileName}`;
    const fileStream = fs.createWriteStream(path);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream);
      file.on('end', () => resolve(`http://${process.env.HOST}:${process.env.PORT}/upload/pictures/${fileName}`));
    });
  }
}

module.exports = LocalStorageService;
