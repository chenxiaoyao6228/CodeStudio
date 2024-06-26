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
            zip.addFile(relativePath + '/', Buffer.alloc(0), '', 0o755); 
            zipFolderRecursive(filePath, zip, baseFolder);
        } else {
            const fileData = fs.readFileSync(filePath);
            zip.addFile(relativePath, fileData, '', 0o644); 
        }
    });
}

function zipFolder(sourceFolder, targetZip) {
    const zip = new AdmZip();
    zipFolderRecursive(sourceFolder, zip, sourceFolder);
    zip.writeZip(targetZip);
}

function unzipFolder(zipFilePath, targetFolder) {
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(targetFolder, true);
}

const name = 'vanilla';
const sourceFolder = `/home/york/projects/CodeStudio/public/templates/${name}`;
const targetZip = `${sourceFolder}.zip`;
const sourceZip = targetZip;
const targetFolder = sourceFolder;

zipFolder(sourceFolder, targetZip);

// unzipFolder(sourceZip, targetFolder);
