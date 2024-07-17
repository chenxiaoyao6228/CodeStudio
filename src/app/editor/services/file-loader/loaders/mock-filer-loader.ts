import { FileSystemTree } from '@webcontainer/api';
import { IFileLoader, IFileLoaderConfig } from '../type';
import { consoleProxyMock } from './_mock/mockFile';

export class mockFileLoader implements IFileLoader {
  async loadFiles(config: IFileLoaderConfig): Promise<FileSystemTree> {
    return Promise.resolve(consoleProxyMock);
  }
}
