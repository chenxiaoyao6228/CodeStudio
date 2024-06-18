import { NodeContainerService } from '@app/editor/services/node-container.service';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  WritableSignal,
  ChangeDetectorRef,
  effect,
  computed,
  OnInit,
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

type FileType = 'file' | 'directory';
export interface FileNode {
  name: string;
  type: FileType;
  expandable: boolean;
  level: number;
  filePath: string;
  id: string;
  children?: FileNode[];
}

type fileOperation =
  | 'creatingFile'
  | 'creatingFolder'
  | 'renaming'
  | 'deleting';

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [MatIconModule, MatTreeModule, CommonModule],
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTreeComponent implements OnInit {
  /*
   * The Mat tree control use tree node reference to expand/collapse node
   * so we have to use a map to keep tack of the node, see the _transformer method
   * otherwise the treeControl.expand(node) will not work
   * poor @angular/material docs......
   */
  trackingNodeMap = new Map();

  cdr = inject(ChangeDetectorRef);
  nodeContainerService = inject(NodeContainerService);
  editorState = inject(EditorStateService);
  editingOperation: WritableSignal<fileOperation | null> = signal(null);
  editingNode: WritableSignal<FileNode | null> = signal(null);

  private _transformer = (node: FileNode, level: number) => {
    const _node = {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      level: level,
      type: node.type,
      filePath: node.filePath,
      id: node.id,
    };

    this.trackingNodeMap.set(_node.id, _node);
    return _node;
  };

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

  // data derived from fileSystemTree
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: FileNode) => node.expandable;

  activeNode = computed(() => {
    const node = this.findNodeByFilePath(
      this.editorState.geCurrentFilePath() || '',
      this.dataSource.data
    );
    return node;
  });

  constructor() {
    effect(() => {
      const currentFilePath = this.editorState.geCurrentFilePath();
      if (currentFilePath) {
        this.jumpToNode(currentFilePath);
      }
    });
  }

  ngOnInit(): void {
    const fileTree = this.editorState.getFileTree();

    if (fileTree) {
      const builtTree = this.buildFileTree(fileTree);
      this.dataSource.data = builtTree;
      this.expandNode(this.dataSource.data[0]);
      this.cdr.markForCheck();
      // reset
      this.editorState.setFileTree({});
    }
  }

  buildFileTree(obj: FileSystemTree, level = 0, basePath = ''): FileNode[] {
    const _obj = {
      FILES: {
        directory: obj,
      },
    };
    const realTree = _buildFileTree(_obj, level, basePath);
    return realTree;

    // https://stackoverflow.com/questions/53280079/tree-how-to-keep-opened-states-when-tree-updated
    function _buildFileTree(
      obj: FileSystemTree,
      level = 0,
      basePath = ''
    ): FileNode[] {
      const nodes: FileNode[] = Object.keys(obj).map((key) => {
        const value = obj[key];
        const filePath =
          level === 0 ? '' : level === 1 ? key : basePath + '/' + key;
        const node: FileNode = {
          name: key,
          type: 'file',
          level: level,
          expandable: false,
          filePath: filePath,
          id: level === 0 ? 'ROOT' : filePath.split('/').join('_'),
        };

        if (Object.prototype.hasOwnProperty.call(value, 'directory')) {
          node.type = 'directory';
          node.children = _buildFileTree(
            (value as DirectoryNode).directory,
            level + 1,
            level === 0
              ? ''
              : level === 1
              ? node.name
              : basePath + '/' + node.name
          ).sort((a, b) => (b.type === 'directory' ? 1 : -1)); // directory shows first
          node.expandable = node.children?.length > 0;
        }

        return node;
      });

      return nodes || [];
    }
  }

  private findNodeByFilePath(
    filePath: string,
    nodes: FileNode[]
  ): FileNode | null {
    for (const node of nodes) {
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
      this.expandNodeFromAncestorRecursively(node);
      // this.cdr.markForCheck(); // 主动触发变更检测
    }
  }

  private expandNodeFromAncestorRecursively(node: FileNode): void {
    const pathSegments = node.filePath.split('/');
    let currentPath = '';
    try {
      this.expandNode(this.dataSource.data[0]);

      for (const segment of pathSegments) {
        currentPath += currentPath === '' ? `${segment}` : `/${segment}`;
        const currentNode = this.findNodeByFilePath(
          currentPath,
          this.dataSource.data
        );
        if (currentNode) {
          this.expandNode(currentNode);
        }
      }
    } catch (error) {
      console.error('expand node error:', error);
      throw error;
    }
  }

  expandNode(node: FileNode) {
    const _node = this.trackingNodeMap.get(node.id);
    if (_node) {
      this.treeControl.expand(_node);
    } else {
      throw new Error('can not find node');
    }
  }

  onNodeClick(node: FileNode): void {
    if (node.type === 'file') {
      this.editorState.setCurrentFilePath(node.filePath);
    }
  }

  onEditingBoxClick(node: FileNode, event: Event) {
    event.stopPropagation();
  }

  onFileOperate(node: FileNode, op: fileOperation, event: Event) {
    event.stopPropagation();
    if (op === 'deleting') {
      this.deleteNode(node);
      return;
    }

    if (node.type === 'directory' && !this.treeControl.isExpanded(node)) {
      this.treeControl.expand(node);
    }
    this.editingNode.set(node);
    this.editingOperation.set(op);

    setTimeout(() => {
      this.getCurrentActiveInput()?.focus();
    }, 0);
  }

  onBlur(event: Event) {
    // this.editingNode.set(null);
  }

  stopEditing(): void {
    this.editingNode.set(null);
  }

  getCurrentActiveInput() {
    if (this.editingNode()) {
      const id = this.editingNode()?.id;
      if (id !== undefined) {
        const activeNodeEle = document.querySelector('#' + id);
        if (activeNodeEle) {
          const activeInput = activeNodeEle.querySelector('input');
          if (activeInput) {
            return activeInput;
          }
        }
      }
    }
    return null;
  }

  onEnter(node: FileNode): void {
    const value = this.getCurrentActiveInput()?.value;

    if (!value) {
      return;
    }

    const op = this.editingOperation();
    const currentNodeType = node.type;
    if (op === 'creatingFile') {
      this.createFile(node, value);
    } else if (op === 'creatingFolder') {
      this.createFolder(node, value);
    } else if (op === 'renaming') {
      if (currentNodeType === 'directory') {
        this.renameFolder(node, value);
      } else {
        this.renameFile(node, value);
      }
    }

    if (this.getCurrentActiveInput()) {
      this.getCurrentActiveInput()!.value = ''; // clear input
    }
  }

  isActive(node: FileNode): boolean {
    return this.activeNode()?.filePath === node?.filePath;
  }

  toggleNode(node: FileNode): void {
    this.treeControl.toggle(node);
    this.onNodeClick(node);
  }

  async getFsTreeWithoutNodeModules() {
    const excludeFolders = ['node_modules'];
    const ft = await this.nodeContainerService.getFileSystemTree(
      '/',
      (path?: string) => !!path && !excludeFolders.includes(path)
    );
    console.log('ft', ft);
    return ft;
  }

  async createFile(parentNode: FileNode, name: string) {
    try {
      const path =
        parentNode.filePath === '' ? name : `${parentNode.filePath}/${name}`;

      await this.nodeContainerService.createFile(path);

      const ft = await this.getFsTreeWithoutNodeModules();

      const builtTree = this.buildFileTree(ft);
      this.dataSource.data = builtTree;

      this.stopEditing();
      this.editorState.setCurrentFilePath(path);
    } catch (error) {
      console.log('createFile Error:', error);
    }
  }

  async createFolder(parentNode: FileNode, name: string) {
    try {
      const path =
        parentNode.filePath === '' ? name : `${parentNode.filePath}/${name}`;

      await this.nodeContainerService.createFolder(path);

      const ft = await this.getFsTreeWithoutNodeModules();

      const builtTree = this.buildFileTree(ft);
      this.dataSource.data = builtTree;

      this.stopEditing();
      this.editorState.setCurrentFilePath(path);
    } catch (error) {
      console.log('createFolder Error:', error);
    }
  }

  async renameFile(node: FileNode, name: string) {}

  async renameFolder(node: FileNode, name: string) {}

  async deleteNode(node: FileNode) {}

  async removeFromTree(tree: FileSystemTree, path: string) {}
}
