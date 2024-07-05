import { FileSystemTree } from '@webcontainer/api';
import { IFileLoader, IFileLoaderConfig } from '../type';

export class LocalFileLoader implements IFileLoader {
  constructor() {}

  async loadFiles(config: IFileLoaderConfig): Promise<FileSystemTree> {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      return await this.readDirectory(dirHandle);
    } catch (error) {
      console.error('Error accessing local directory:', error);
      throw new Error(
        'Unable to access local directory. Please ensure the correct permissions are granted.'
      );
    }
  }

  private async readDirectory(
    dirHandle: any,
    path: string = ''
  ): Promise<FileSystemTree> {
    const files: FileSystemTree = {};
    try {
      const EXCLUDE_DIRS = [
        'node_modules',
        '.git',
        '.svn',
        '.hg',
        '.DS_Store',
        'Thumbs.db',
        '.idea',
        '.angular',
        '.vscode',
        'dist',
      ];
      for await (const [name, handle] of dirHandle.entries()) {
        if (EXCLUDE_DIRS.indexOf(name) > -1) {
          continue;
        }

        const relativePath = path === '' ? name : `${path}/${name}`;
        if (handle.kind === 'file') {
          try {
            const file = await handle.getFile();
            files[name] = {
              file: { contents: await file.text() },
            };
          } catch (fileError) {
            console.error(`Error reading file: ${relativePath}`, fileError);
            throw new Error(`Unable to read file: ${relativePath}`);
          }
        } else if (handle.kind === 'directory') {
          files[name] = {
            directory: await this.readDirectory(handle, relativePath),
          };
        }
      }
    } catch (dirError) {
      console.error(`Error reading directory: ${path}`, dirError);
      throw new Error(`Unable to read directory: ${path}`);
    }
    return files;
  }
}
