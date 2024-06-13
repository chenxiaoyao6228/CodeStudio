import { FileSystemTree } from '@webcontainer/api';

export interface IFileLoader {
  loadFiles(config: IFileLoaderConfig): Promise<FileSystemTree>;
}

export interface IFileLoaderConfig {
  source: string;
  [key: string]: any; // any other config
}
