import { MatIconModule } from '@angular/material/icon';
import { Component, OnChanges } from '@angular/core';
import { MatTree, MatTreeModule, MatTreeNode } from '@angular/material/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { DirectoryNode, FileSystemTree } from '@webcontainer/api';
import { mockFileSystemTree } from './mock';
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
  styleUrl: './file-tree.component.scss',
})
export class FileTreeComponent implements OnChanges {
  fileSystemTree: FileSystemTree = mockFileSystemTree; // TODO: 改为input与output
  activeNode: FileNode | null = null;

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

  constructor() {
    const fileTreeFromSystem = this.buildFileTree(this.fileSystemTree);
    this.dataSource.data = fileTreeFromSystem;
  }

  ngOnChanges() {
    this.dataSource.data = this.buildFileTree(this.fileSystemTree);
  }

  buildFileTree(obj: FileSystemTree, level: number = 0): FileNode[] {
    return Object.keys(obj).reduce<FileNode[]>((accumulator, key) => {
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

      return accumulator.concat(node);
    }, []);
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
        this.fileSystemTree,
        `${this.activeNode.name}/newFile.txt`,
        'New file content'
      );
      this.ngOnChanges();
    }
  }

  createFolder(): void {
    if (this.activeNode) {
      this.addToTree(
        this.fileSystemTree,
        `${this.activeNode.name}/newFolder/`,
        ''
      );
      this.ngOnChanges();
    }
  }
  toggleNode(node: FileNode): void {
    this.treeControl.toggle(node);
    this.onNodeClick(node);
  }
}
