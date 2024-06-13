import { DirectoryNode, FileSystemTree } from '@webcontainer/api';
import JSZip from 'jszip';
import { IFileLoaderConfig, IFileLoader } from '../type';

export class ZipFileLoader implements IFileLoader {
  constructor() {}

  async loadFiles({ source }: IFileLoaderConfig): Promise<FileSystemTree> {
    const response = await fetch(source, {
      headers: {
        'User-Agent': 'request',
      },
    });
    const blob = await response.blob();
    const zip = await JSZip.loadAsync(blob);
    const files: FileSystemTree = {};

    const processFile = async (
      relativePath: string,
      file: JSZip.JSZipObject
    ) => {
      const segments = relativePath.split('/');
      let current: FileSystemTree | DirectoryNode = files;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (i === segments.length - 1 && !file.dir) {
          (current as FileSystemTree)[segment] = {
            file: {
              contents: await file.async('string'),
            },
          };
        } else {
          if (!(segment in (current as FileSystemTree))) {
            (current as FileSystemTree)[segment] = {
              directory: {},
            };
          }
          current = // @ts-ignore
          (current as FileSystemTree)[segment].directory as DirectoryNode;
        }
      }
    };

    await Promise.all(
      Object.keys(zip.files).map(async (relativePath) => {
        const file = zip.files[relativePath];
        await processFile(relativePath, file);
      })
    );

    return files;
  }
}
