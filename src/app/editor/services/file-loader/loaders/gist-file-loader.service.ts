import JSZip from 'jszip';
import { DirectoryNode, FileSystemTree } from '@webcontainer/api';
import { IFileLoader, IFileLoaderConfig } from '../type';

export class GistFileLoader implements IFileLoader {
  constructor() {}

  async loadFiles(config: IFileLoaderConfig): Promise<FileSystemTree> {
    const { source } = config;
    const fileContent = await this.getFileContentFromUrl(source);

    const fileSystemTree: FileSystemTree = {};
    await this.processZipFile(fileSystemTree, fileContent);

    return fileSystemTree;
  }

  private async getFileContentFromUrl(url: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(url);
      const base64Content = await response.text();
      return base64ToArrayBuffer(base64Content);
    } catch (error) {
      console.error('Error fetching file content from URL:', error);
      throw error;
    }
  }

  private async processZipFile(
    fileSystemTree: FileSystemTree,
    arrayBuffer: ArrayBuffer
  ): Promise<void> {
    const zip = await JSZip.loadAsync(arrayBuffer);

    const processFile = async (
      relativePath: string,
      file: JSZip.JSZipObject
    ) => {
      const segments = relativePath.split('/');
      let current: FileSystemTree | DirectoryNode = fileSystemTree;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (i === segments.length - 1 && !file.dir) {
          let contents: string | Uint8Array;

          // @ts-ignore
          if (file._dataBinary) {
            // Handle binary files
            contents = await file.async('uint8array');
          } else {
            // Handle text files
            contents = await file.async('string');
          }

          (current as FileSystemTree)[segment] = {
            file: {
              contents: contents,
            },
          };
        } else {
          if (segment === '') {
            continue;
          }
          if (!(segment in (current as FileSystemTree))) {
            (current as FileSystemTree)[segment] = {
              directory: {},
            };
          }
          current = //@ts-ignore
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
  }

  static validatePath(path: string): boolean {
    return path.indexOf('gist.githubusercontent.com') > -1;
  }
}

// helper function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // remove Data URL prefix
  const base64String = base64.split(',')[1];
  const binaryString = window.atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
