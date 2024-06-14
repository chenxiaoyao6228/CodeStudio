import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  WritableSignal,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NodeContainerService } from '@app/editor/services/node-container.service';
import { AppEditorComponent } from './code-editor/code-editor.component';
import { EditorStateService } from '@app/editor/services/editor-state.service';
import { CodeEditorService } from './code-editor/code-editor.service';

interface ITabItem {
  filePath: string;
  name: string;
  active: boolean;
  isPendingWrite: boolean;
}

@Component({
  standalone: true,
  selector: 'app-edit',
  imports: [AppEditorComponent],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditComponent {
  @ViewChild(AppEditorComponent) editorComponent:
    | AppEditorComponent
    | undefined;

  private readonly nodeContainerService = inject(NodeContainerService);
  private readonly editorStateService = inject(EditorStateService);
  private readonly codeEditorService = inject(CodeEditorService);

  openedTabs: WritableSignal<ITabItem[]> = signal([]);
  // openedTabs: WritableSignal<ITabItem[]> = signal(
  //   ['README.md', 'vite.config.js', 'package.json', '.gitignore'].map(
  //     (i, index) => ({
  //       filePath: i,
  //       name: i,
  //       active: index === 1,
  //       isPendingWrite: true,
  //     })
  //   )
  // );

  options = {
    theme: 'vs-dark',
    language: 'javascript',
    fontSize: 16,
    wordWrap: 'on',
    automaticLayout: true,
  };

  constructor() {
    effect(async () => {
      const currentFilePath = this.editorStateService.geCurrentFilePath();
      if (currentFilePath) {
        try {
          const content = await this.nodeContainerService.readFile(
            currentFilePath
          );
          this.updateTabs(currentFilePath);
          if (content) {
            this.codeEditorService.openOrCreateFile({
              content,
              language: this.getLanguageByFilePath(currentFilePath),
              filePath: currentFilePath,
            });
          }
          // console.log('content', content);
        } catch (error) {
          console.log('error', error);
        }
      }
    });
  }

  ngOnInit() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
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

  closeTab(tabItem: ITabItem, event: Event) {
    event.stopPropagation();

    const openedTabs = this.openedTabs().slice();
    const findIndex = openedTabs.findIndex(
      (t) => t.filePath === tabItem.filePath
    );

    if (findIndex === -1) {
      // If the specified tab is not found, return directly
      return;
    }

    const newTabs = openedTabs.filter((t) => t.filePath !== tabItem.filePath);
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

  async handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      await this.saveFile();
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

  getLanguageByFilePath(filePath: string) {
    const suffix = filePath.split('.').pop() || 'default';

    const languageMap: { [key: string]: string } = {
      js: 'javascript',
      mjs: 'javascript',
      css: 'css',
      ts: 'typescript',
      tsx: 'typescript',
      html: 'html',
      json: 'json',
      md: 'markdown',
      yaml: 'yaml',
      prettierrc: 'json',
      default: 'json',
    };

    return languageMap[suffix] || 'json';
  }

  extractFileName(filePath: string): string {
    const match = filePath.match(/[^/\\]+$/);

    if (match) {
      return match[0];
    }

    return '';
  }
}
