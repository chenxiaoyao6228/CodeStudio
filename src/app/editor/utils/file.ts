import { FileSystemTree } from '@webcontainer/api';

export function isDirectory(tree: FileSystemTree, filePath: string): boolean {
  const node = getNodeAtPath(tree, filePath);
  return node !== null && 'directory' in node;
}

export function isFile(tree: FileSystemTree, filePath: string): boolean {
  const node = getNodeAtPath(tree, filePath);
  return node !== null && 'file' in node;
}

function getNodeAtPath(tree: FileSystemTree, filePath: string) {
  const hasParts = filePath.indexOf('/') > -1;
  if (hasParts) {
    const parts = filePath.split('/');
    const lastPart = parts.pop(); // 获取并移除数组的最后一个元素

    let currentNode: any = tree;

    for (const part of parts) {
      if (!currentNode || !(part in currentNode)) {
        return null;
      }
      currentNode = currentNode[part]['directory'];
    }
    return currentNode[lastPart as string];
  } else {
    return tree[filePath];
  }
}

export function getFileOrFolderName(path: string) {
  return path.substring(path.lastIndexOf('/') + 1);
}
