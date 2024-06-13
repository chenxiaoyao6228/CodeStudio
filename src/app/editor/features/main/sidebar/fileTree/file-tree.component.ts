import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  effect,
  OnChanges,
  inject,
} from '@angular/core';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { DirectoryNode, FileSystemTree } from '@webcontainer/api';
import { Subscription } from 'rxjs';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { EditorStateService } from '@app/editor/services/editor-state.service';
import { NgClass, NgStyle } from '@angular/common';

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  expandable: boolean;
  level: number;
  children?: FileNode[];
}

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [MatIconModule, MatTreeModule, NgClass, NgStyle],
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss'],
})
export class FileTreeComponent implements OnInit, OnDestroy {
  editorState = inject(EditorStateService);
  fileSystemTree: FileSystemTree | null = null;
  activeNode: FileNode | null = null;
  private subscription: Subscription | null = null;

  private _transformer = (node: FileNode, level: number) => ({
    expandable: !!node.children && node.children.length > 0,
    name: node.name,
    level: level,
    type: node.type,
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
  loadedFileTreeEffect: any;

  constructor() {}

  ngOnInit() {
    this.editorState.loadedFileTree$.subscribe((fileTree) => {
      this.fileSystemTree = fileTree;
      this.dataSource.data = this.buildFileTree(fileTree);
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  buildFileTree(obj: FileSystemTree, level: number = 0): FileNode[] {
    const nodes: FileNode[] = Object.keys(obj).map((key) => {
      const value = obj[key];
      const node: FileNode = {
        name: key,
        type: 'file',
        level: level,
        expandable: false,
      };

      if (value.hasOwnProperty('directory')) {
        node.type = 'directory';
        node.children = this.buildFileTree(
          (value as DirectoryNode).directory,
          level + 1
        );
        node.expandable = node.children?.length > 0;
      }

      return node;
    });

    return nodes;
  }

  onNodeClick(node: FileNode): void {
    this.activeNode = node;
  }

  isActive(node: FileNode): boolean {
    return this.activeNode === node;
  }

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
        this.fileSystemTree!,
        `${this.activeNode.name}/newFile.txt`,
        'New file content'
      );
    }
  }

  createFolder(): void {
    if (this.activeNode) {
      this.addToTree(
        this.fileSystemTree!,
        `${this.activeNode.name}/newFolder/`,
        ''
      );
    }
  }

  toggleNode(node: FileNode): void {
    this.treeControl.toggle(node);
    this.onNodeClick(node);
  }
}
