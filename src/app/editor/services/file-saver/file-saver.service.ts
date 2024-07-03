import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { NodeContainerService } from '../node-container.service';
import { LocalStorage } from './storage/local';
import { IStorage } from './type';
import { FileSystemTree } from '@webcontainer/api';
import { GistStorage } from './storage/gist';

@Injectable({
    providedIn: 'root',
})
export class FileSaverService {
    constructor(private nodeContainerService: NodeContainerService) { }


    async downloadProject(name = 'project') {

        const localStorage = new LocalStorage();
        await this.saveProject(localStorage, `${name}.zip`);
    }

    async uploadToGist(token: string, name = 'project') {
        const gistStorage = new GistStorage(token);
        await this.saveProject(gistStorage, `${name}.zip`);
    }


    async saveProject(storage: IStorage, filename: string) {
        const zip = new JSZip();
        const fileSystemTree = await this.nodeContainerService.getFileSystemTree(
            '/',
            (path) => !path?.includes('node_modules')
        );

        this.attachMetaData(fileSystemTree)

        await this.addFilesToZip(zip, fileSystemTree, '');
        const content = await zip.generateAsync({ type: 'blob' });
        await storage.save(content, filename);
    }

    private attachMetaData(fileSystemTree: FileSystemTree) {
        const KEY = 'codestudio.json'
        const now = new Date();
        const meta = {
            "description": "meta data description for code-studio",
            "title": "untitled",
            "created_at": now.toISOString().replace('T', ' ').split('.')[0],
            "updated_at": now.toISOString().replace('T', ' ').split('.')[0]
        };
        fileSystemTree[KEY] = {
            file: {
                contents: JSON.stringify(meta, null, 2),
            }
        }
    }

    private async addFilesToZip(
        zip: JSZip,
        fileSystemTree: FileSystemTree,
        parentPath: string
    ) {
        for (const key in fileSystemTree) {
            if (Object.prototype.hasOwnProperty.call(fileSystemTree, key)) {
                const item = fileSystemTree[key];
                const fullPath = parentPath ? `${parentPath}/${key}` : key;

                if ('file' in item) {
                    zip.file(fullPath, item.file.contents);
                } else if ('directory' in item) {
                    const folder = zip.folder(fullPath);
                    await this.addFilesToZip(folder!, item.directory, fullPath);
                }
            }
        }
    }
}
