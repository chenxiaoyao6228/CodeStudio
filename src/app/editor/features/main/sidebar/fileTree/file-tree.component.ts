import {
  Component,
  effect,
  inject,
  ChangeDetectionStrategy,
  signal,
  WritableSignal,
  ChangeDetectorRef,
} from '@angular/core';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { DirectoryNode, FileSystemTree } from '@webcontainer/api';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { EditorStateService } from '@app/editor/services/editor-state.service';
import { CommonModule } from '@angular/common';

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  expandable: boolean;
  level: number;
  filePath: string;
  children?: FileNode[];
}

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [MatIconModule, MatTreeModule, CommonModule],
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTreeComponent {
  editorState = inject(EditorStateService);
  fileSystemTree: WritableSignal<FileSystemTree | null> = signal(null);
  activeNode: FileNode | null = null;
  hoverNode: FileNode | null = null;
  cdr = inject(ChangeDetectorRef);

  private _transformer = (node: FileNode, level: number) => ({
    expandable: !!node.children && node.children.length > 0,
    name: node.name,
    level: level,
    type: node.type,
    filePath: node.filePath,
  });

  treeControl = new FlatTreeControl<FileNode>(
    (node) => node.level,
    (node) => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: FileNode) => node.expandable;

  constructor() {
    effect(() => {
      const currentFilePath = this.editorState.geCurrentFilePath();
      if (
        currentFilePath &&
        (!this.activeNode || this.activeNode?.filePath !== currentFilePath)
      ) {
        this.jumpToNode(currentFilePath);
      }
    });
    effect(() => {
      const fileTree = this.editorState.getFileTree();
      if (fileTree) {
        const builtTree = this.buildFileTree(fileTree);
        console.log('builtTree', builtTree);
        this.dataSource.data = builtTree;
      }
    });
  }
  buildFileTree(
    obj: FileSystemTree,
    level: number = 0,
    basePath = ''
  ): FileNode[] {
    const _obj = {
      FILES: {
        directory: obj,
      },
    };
    const realTree = this._buildFileTree(_obj, level, basePath);
    // console.log('realTree', realTree);
    return realTree;
  }

  _buildFileTree(
    obj: FileSystemTree,
    level: number = 0,
    basePath = ''
  ): FileNode[] {
    const nodes: FileNode[] = Object.keys(obj).map((key) => {
      const value = obj[key];
      const node: FileNode = {
        name: key,
        type: 'file',
        level: level,
        expandable: false,
        filePath: level === 0 ? '' : level === 1 ? key : basePath + '/' + key,
      };

      if (value.hasOwnProperty('directory')) {
        node.type = 'directory';
        node.children = this._buildFileTree(
          (value as DirectoryNode).directory,
          level + 1,
          level === 0
            ? ''
            : level === 1
            ? node.name
            : basePath + '/' + node.name
        );
        node.expandable = node.children?.length > 0;
      }

      return node;
    });

    return nodes;
  }

  private findNodeByFilePath(
    filePath: string,
    nodes: FileNode[]
  ): FileNode | null {
    for (let node of nodes) {
      if (node.filePath === filePath) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeByFilePath(filePath, node.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  private jumpToNode(filePath: string): void {
    const node = this.findNodeByFilePath(filePath, this.dataSource.data);
    if (node) {
      this.activeNode = node;
      this.treeControl.expand(node);
      this.cdr.detectChanges();
    }
  }

  onNodeClick(node: FileNode): void {
    this.activeNode = node;
    if (node.type === 'file') {
      this.editorState.setCurrentFilePath(node.filePath);
    }
  }

  isActive(node: FileNode): boolean {
    return this.activeNode?.filePath === node?.filePath;
  }

  toggleNode(node: FileNode): void {
    this.treeControl.toggle(node);
    this.onNodeClick(node);
  }

  // file handling
  addToTree(tree: FileSystemTree, path: string, content: string): void {
    const parts = path.split('/');
    const fileName = parts.pop();
    let current: FileSystemTree = tree;

    parts.forEach((part) => {
      if (!current[part]) {
        current[part] = { directory: {} };
      }
      current = (current[part] as DirectoryNode).directory;
    });

    current[fileName!] = { file: { contents: content } };
  }

  createFile(): void {
    if (this.activeNode) {
      this.addToTree(
        this.fileSystemTree()!,
        `${this.activeNode.name}/newFile.txt`,
        'New file content'
      );
    }
  }

  createFolder(): void {
    if (this.activeNode) {
      this.addToTree(
        this.fileSystemTree()!,
        `${this.activeNode.name}/newFolder/`,
        ''
      );
    }
  }

  renameNode(node: FileNode): void {
    // Implement rename node logic here
  }

  duplicateNode(node: FileNode): void {
    // Implement duplicate node logic here
  }

  deleteNode(node: FileNode): void {
    // Implement delete node logic here
  }

  addChildNode(node: FileNode): void {
    // Implement add child node logic here
  }
}
