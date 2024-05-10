const fs = require('fs');
const path = require('path');

function getImagePaths(folderPath) {
  try {
    const imageExtensions = ['jpg', 'tif', 'png', 'webp', 'bmp'];
    const imagePaths = [];

    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    files.forEach((file) => {
      if (file.isFile() && imageExtensions.includes(file.name.split('.').pop())) {
        const filePath = path.join(folderPath, file.name);
        imagePaths.push(filePath);
      }
    });

    return imagePaths;
  } catch (e) {
    return [];
  }
}

module.exports = getImagePaths;
