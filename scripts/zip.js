const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

function zipFolderRecursive(folderPath, zip, baseFolder) {
    const files = fs.readdirSync(folderPath);

    files.forEach(file => {
        const filePath = path.join(folderPath, file);
        const relativePath = path.relative(baseFolder, filePath);

        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            zip.addFile(relativePath + '/', Buffer.alloc(0), '', 0o755); // Add empty directory
            zipFolderRecursive(filePath, zip, baseFolder);
        } else {
            const fileData = fs.readFileSync(filePath);
            zip.addFile(relativePath, fileData, '', 0o644); // Add file
        }
    });
}

function zipFolder(sourceFolder, targetZip) {
    const zip = new AdmZip();

    zipFolderRecursive(sourceFolder, zip, sourceFolder);

    zip.writeZip(targetZip);
}

const name = 'preact'
zipFolder(`/home/york/CodeStudio/public/${name}`, `/home/york/CodeStudio/public/templates/${name}.zip`);