const zl = require("zip-lib");
const fs = require('fs');
const currentDir = process.cwd();

const projectName = currentDir.replace(/\\/g, '/');

const projectNameArr = projectName.split('/');

const zip = new zl.Zip();
// Adds a file from the file system
zip.addFile('manifest.json');
zip.addFile('Magick.Native-Q16-x64.dll');
// Adds a folder from the file system, putting its contents at the root of archive
zip.addFolder("plugin-server", 'plugin-server');
zip.addFolder("resources", 'resources');
// Generate zip file.
zip.archive(`${projectNameArr[projectNameArr.length -1]}.zip`).then(function () {
    console.log("Finished zip files");
}, function (err) {
    console.log(err);
});