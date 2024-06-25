// edit.service.ts

import { Injectable, inject } from '@angular/core';
import { NodeContainerService } from '@app/editor/services/node-container.service';
import { EditorStateService } from '@app/editor/services/editor-state.service';
import { CodeEditorService } from './code-editor/code-editor.service';
import { isFile } from '@app/editor/utils/file';
import { WritableSignal, signal, effect } from '@angular/core';

export interface ITabItem {
  filePath: string;
  name: string;
  active: boolean;
  isPendingWrite: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EditService {
  private readonly nodeContainerService = inject(NodeContainerService);
  private readonly editorStateService = inject(EditorStateService);
  private readonly codeEditorService = inject(CodeEditorService);

  openedTabs: WritableSignal<ITabItem[]> = signal([]);

  constructor() {
    effect(async () => {
      const currentFilePath = this.editorStateService.geCurrentFilePath();
      const fileTree = this.editorStateService.getFileTree();
      if (currentFilePath && fileTree && isFile(fileTree, currentFilePath)) {
        try {
          const content = await this.nodeContainerService.readFile(
            currentFilePath
          );
          this.updateTabs(currentFilePath);
          if (content !== undefined) {
            this.codeEditorService.openOrCreateFile({
              content,
              filePath: currentFilePath,
            });
          }
        } catch (error) {
          console.log('error', error);
        }
      }
    });
  }

  initEvents() {
    this.codeEditorService.on('contentChanged', ({ content, filePath }) => {
      this.openedTabs.update((tabs) =>
        tabs.map((t) => ({
          ...t,
          isPendingWrite: t.filePath === filePath ? true : t.isPendingWrite,
        }))
      );
    });
  }

  updateTabs(filePath: string) {
    const isTabExist = this.openedTabs().find((t) => t.filePath === filePath);
    if (!isTabExist) {
      const newTab = {
        filePath: filePath,
        name: this.extractFileName(filePath),
        isPendingWrite: false,
        active: true,
      };
      this.openedTabs.update((tabs) => [
        ...tabs.map((t) => ({
          ...t,
          active: false,
        })),
        newTab,
      ]);
    } else {
      this.openedTabs.update((tabs) =>
        tabs.map((t) => ({
          ...t,
          active: t.filePath === filePath,
        }))
      );
    }
  }

  selectTab(tab: ITabItem) {
    this.editorStateService.setCurrentFilePath(tab.filePath);
  }

  closeTab(filePath: string) {
    const openedTabs = this.openedTabs().slice();
    const findIndex = openedTabs.findIndex((t) => t.filePath === filePath);

    if (findIndex === -1) {
      // If the specified tab is not found, return directly
      return;
    }

    // editor close model to release memory
    this.codeEditorService.closeFile(filePath);

    const newTabs = openedTabs.filter((t) => t.filePath !== filePath);
    this.openedTabs.set(newTabs);

    if (newTabs.length === 0) {
      // If there are no open tabs, set the current file path to an empty string
      this.editorStateService.setCurrentFilePath('');
    } else {
      // Calculate the new active tab index, focusing on the previous tab if possible
      const newActiveIndex = findIndex > 0 ? findIndex - 1 : 0;
      this.editorStateService.setCurrentFilePath(
        newTabs[newActiveIndex].filePath
      );
    }
  }

  async saveFile() {
    const filePath = this.editorStateService.geCurrentFilePath();
    if (filePath) {
      const content = this.codeEditorService.getCurrentFileContent();
      if (content) {
        this.nodeContainerService.writeFile(filePath, content);

        this.openedTabs.update((tabs) =>
          tabs.map((t) => ({
            ...t,
            isPendingWrite: t.filePath === filePath ? false : t.isPendingWrite,
          }))
        );
      }
    }
  }

  extractFileName(filePath: string): string {
    const match = filePath.match(/[^/\\]+$/);

    if (match) {
      return match[0];
    }

    return '';
  }
}
