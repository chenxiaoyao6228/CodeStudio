import { Injectable } from '@angular/core';
import { MainService } from '../features/main/main.service';
import hotkeys from 'hotkeys-js';

/*
 * reference
 * https://codesandbox.io/docs/learn/editors/web/shortcuts
 * https://developer.stackblitz.com/guides/user-guide/keyboard-shortcuts
 * https://codepen.io/iiCe89/pen/gMYVYQ
 *
 * https://github.com/microsoft/monaco-editor/issues/102
 */

interface ShortcutConfig {
  shortcut: string;
  description: string;
  action: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class ShortcutService {
  private shortcuts: ShortcutConfig[] = [];

  constructor(private mainService: MainService) {
    this.initializeShortcuts();
  }

  private initializeShortcuts() {
    this.addShortcut('ctrl+b', 'Toggle File Tree', () =>
      this.mainService.toggleFileTree()
    );
    this.addShortcut('ctrl+`', 'Toggle Terminal', () =>
      this.mainService.toggleTerminal()
    );
    this.addShortcut('ctrl+shift+o', 'Toggle Console', () =>
      this.mainService.toggleConsole()
    );
  }

  private addShortcut(
    shortcut: string,
    description: string,
    action: () => void
  ) {
    this.shortcuts.push({ shortcut, description, action });
    hotkeys(shortcut, (event, handler) => {
      event.preventDefault();
      action();
    });
  }

  public getShortcuts(): ShortcutConfig[] {
    return this.shortcuts;
  }

  public handleShortcut(shortcut: string) {
    const found = this.shortcuts.find((s) => s.shortcut === shortcut);
    if (found) {
      found.action();
    }
  }

  public overrideMonacoShortcuts(editor: monaco.editor.IStandaloneCodeEditor) {
    this.shortcuts.forEach((sc) => {
      const keybinding = this.convertToMonacoKeybinding(sc.shortcut);
      if (keybinding !== null) {
        editor.addCommand(keybinding, () => {
          this.handleShortcut(sc.shortcut);
        });
      }
    });
  }

  private convertToMonacoKeybinding(shortcut: string): number | null {
    switch (shortcut) {
      case 'ctrl+b':
        return monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB;
      case 'ctrl+`':
        return monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote;
      case 'ctrl+shift+o':
        return (
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyO
        );
      default:
        return null;
    }
  }
}
