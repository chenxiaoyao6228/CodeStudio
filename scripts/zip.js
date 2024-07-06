const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

function deleteNodeModules(folderPath) {
    const files = fs.readdirSync(folderPath);

    files.forEach(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            if (file === 'node_modules') {
                fs.rmSync(filePath, { recursive: true, force: true });
                console.log(`Deleted ${filePath}`);
            } else {
                deleteNodeModules(filePath);
            }
        }
    });
}

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
    deleteNodeModules(sourceFolder);
    zipFolderRecursive(sourceFolder, zip, sourceFolder);
    zip.writeZip(targetZip);
    console.log(`Zipped ${sourceFolder} to ${targetZip}`);
}

function unzipFolder(zipFilePath, targetFolder) {
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(targetFolder, true);
    console.log(`Unzipped ${zipFilePath} to ${targetFolder}`);
}

const args = process.argv.slice(2);

let name = '';
let action = '';

args.forEach((arg, index) => {
    if (arg === '--name' && args[index + 1]) {
        name = args[index + 1];
    } else if (arg === '--zip') {
        action = 'zip';
    } else if (arg === '--unzip') {
        action = 'unzip';
    }
});

if (!name) {
    console.log('Please provide a folder name using --name argument.');
} else if (action === 'zip') {
    const sourceFolder = `/home/york/projects/CodeStudio/public/templates/${name}`;
    const targetZip = `${sourceFolder}.zip`;
    zipFolder(sourceFolder, targetZip);
} else if (action === 'unzip') {
    const sourceZip = `/home/york/projects/CodeStudio/public/templates/${name}.zip`;
    const targetFolder = `/home/york/projects/CodeStudio/public/templates/${name}`;
    unzipFolder(sourceZip, targetFolder);
} else {
    console.log('Please provide --zip or --unzip argument.');
}
