import { Injectable } from '@angular/core';
import { IFileLoaderConfig, IFileLoader } from './type';
import { GithubFileLoader } from './loaders/github-file-loader.service';
import { ZipFileLoader } from './loaders/zip-file-loader.service';
import { LocalFileLoader } from './loaders/local-filer-loader';
import { mockFileLoader } from './loaders/mock-filer-loader';
import { GistFileLoader } from './loaders/gist-file-loader.service';
import { FileSystemTree } from '@webcontainer/api';
import {
  isEntryFile,
  injectProxyScriptToEntryHTML,
} from '../../features/main/ouput/console/getProxyConsoleScript';

@Injectable({
  providedIn: 'root',
})
export class FileLoaderFactory {
  async loadFiles(config: IFileLoaderConfig) {
    const loader = this.createFileLoader(config);
    const fileTree = await loader.loadFiles(config);

    this.processFileTree(fileTree);

    return fileTree;
  }

  private createFileLoader(config: IFileLoaderConfig): IFileLoader {
    if (GistFileLoader.validatePath(config.source)) {
      return new GistFileLoader();
    } else if (config.source.endsWith('.zip')) {
      return new ZipFileLoader();
    } else if (GithubFileLoader.validatePath(config.source)) {
      return new GithubFileLoader();
    } else if (config.source === 'local') {
      return new LocalFileLoader();
    } else if (config.source === 'mock') {
      return new mockFileLoader();
    } else {
      throw new Error('Unsupported file source');
    }
  }

  private processFileTree(fileTree: FileSystemTree) {
    for (const key in fileTree) {
      if (Object.prototype.hasOwnProperty.call(fileTree, key)) {
        const node = fileTree[key];
        if ('file' in node) {
          if (isEntryFile(key)) {
            node.file.contents = injectProxyScriptToEntryHTML(
              node.file.contents
            );
            break; // break after found
          }
        } else if ('directory' in node) {
          this.processFileTree(node.directory);
        }
      }
    }
  }
}
