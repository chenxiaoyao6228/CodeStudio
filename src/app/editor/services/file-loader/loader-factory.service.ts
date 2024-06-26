import { Injectable } from '@angular/core';
import { IFileLoaderConfig, IFileLoader } from './type';
import { GithubFileLoader } from './loaders/github-file-loader.service';
import { ZipFileLoader } from './loaders/zip-file-loader.service';
import { LocalFileLoader } from './loaders/local-filer-loader';
import { mockFileLoader } from './loaders/mock-filer-loader';

@Injectable({
  providedIn: 'root',
})
export class FileLoaderFactory {
  constructor() {}

  loadFiles(config: IFileLoaderConfig) {
    const loader = this.createFileLoader(config);
    return loader.loadFiles(config);
  }

  private createFileLoader(config: IFileLoaderConfig): IFileLoader {
    if (config.source.endsWith('.zip')) {
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
}
