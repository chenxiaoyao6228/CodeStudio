import { inject, Injectable } from '@angular/core';
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
  localSaver = inject(LocalStorage);
  gistSaver = inject(GistStorage);
  nodeContainerService = inject(NodeContainerService);
  constructor() {}

  async downloadProject(name = 'project') {
    await this.saveProject(this.localSaver, `${name}.zip`);
  }

  async uploadToGist(name = 'project', extraParams?: Record<string, any>) {
    await this.saveProject(this.gistSaver, `${name}`, {
      ...extraParams,
      description: this.createDescription(),
    });
  }

  async saveProject(
    storage: IStorage,
    filename: string,
    extraParams?: Record<string, any>
  ) {
    const zip = new JSZip();
    const fileSystemTree = await this.nodeContainerService.getFileSystemTree(
      '/',
      (path) => !path?.includes('node_modules')
    );

    // this.attachMetaData(fileSystemTree)

    await this.addFilesToZip(zip, fileSystemTree, '');
    const content = await zip.generateAsync({ type: 'blob' });
    await storage.save(content, filename, extraParams);
  }

  createDescription() {
    return 'meta data description for code-studio';
  }

  private attachMetaData(fileSystemTree: FileSystemTree) {
    const KEY = 'codestudio.json';
    const now = new Date();
    const meta = {
      title: 'untitled',
      description: this.createDescription(),
      created_at: now.toISOString().replace('T', ' ').split('.')[0],
      updated_at: now.toISOString().replace('T', ' ').split('.')[0],
    };
    fileSystemTree[KEY] = {
      file: {
        contents: JSON.stringify(meta, null, 2),
      },
    };
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

        console.log(`Adding path: ${fullPath}`);

        if ('file' in item) {
          zip.file(fullPath, item.file.contents);
        } else if ('directory' in item) {
          // Create the folder in the existing zip instance
          zip.folder(fullPath);
          // Add files to the created folder
          await this.addFilesToZip(zip, item.directory, fullPath);
        }
      }
    }
  }
}
