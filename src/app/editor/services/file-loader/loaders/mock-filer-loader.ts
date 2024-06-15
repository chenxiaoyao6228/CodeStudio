import { FileSystemTree } from '@webcontainer/api';
import { IFileLoader, IFileLoaderConfig } from '../type';
import { mockFiles, mockFiles2 } from './_mock/mockFile';

export class mockFileLoader implements IFileLoader {
  constructor() {}
  async loadFiles(config: IFileLoaderConfig): Promise<FileSystemTree> {
    return Promise.resolve(mockFiles2);
  }
}
