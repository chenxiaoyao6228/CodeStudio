import { FileSystemTree } from '@webcontainer/api';
import { IFileLoader, IFileLoaderConfig } from '../type';

export class LocalFileLoader implements IFileLoader {
  constructor() {}
  async loadFiles(config: IFileLoaderConfig): Promise<FileSystemTree> {
    const dirHandle = await (window as any).showDirectoryPicker();
    return await this.readDirectory(dirHandle);
  }

  private async readDirectory(
    dirHandle: any,
    path: string = ''
  ): Promise<FileSystemTree> {
    const files: FileSystemTree = {};
    for await (const [name, handle] of dirHandle.entries()) {
      const relativePath = `${path}/${name}`;
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        files[relativePath] = {
          file: { contents: await file.text() },
        };
      } else if (handle.kind === 'directory') {
        files[relativePath] = {
          directory: await this.readDirectory(handle, relativePath),
        };
      }
    }
    return files;
  }
}
