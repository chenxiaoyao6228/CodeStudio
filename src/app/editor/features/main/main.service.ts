import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  mainResizer: any;
  outputResizer: any = null;
  editResizer: any = null;
  isPreviewOpen = signal(true);
  isConsoleOpen = signal(true);
  isTerminalOpen = signal(true);
  isFileTreeOpen = signal(true);

  setMainResizer(resizer: any) {
    this.mainResizer = resizer;
  }

  setOutputResizer(resizer: any) {
    this.outputResizer = resizer;
  }

  setEditResizer(resizer: any) {
    this.editResizer = resizer;
  }

  // horizontal split: fileTree, editor, preview
  togglePreview() {
    if (this.isPreviewOpen()) {
      this.collapsePreview();
    } else {
      this.openPreview();
    }
  }

  collapsePreview() {
    const oldResizeList = this.mainResizer.resizeService.resizeList;
    const oldEditorPercentage = oldResizeList[1].percentage;
    const oldPreviewPercentage = oldResizeList[2].percentage;
    const newResizeList = [
      oldResizeList[0],
      {
        ...oldResizeList[1],
        percentage: oldEditorPercentage + oldPreviewPercentage,
      },
      {
        ...oldResizeList[2],
        percentage: 0,
      },
    ];

    this.mainResizer.resizeService.setResizelist(newResizeList);

    this.isPreviewOpen.set(false);
  }

  openPreview() {
    const oldResizeList = this.mainResizer.resizeService.resizeList;
    const oldEditorPercentage = oldResizeList[1].percentage;
    const newResizeList = [
      oldResizeList[0],
      {
        ...oldResizeList[1],
        percentage: oldEditorPercentage / 2,
      },
      {
        ...oldResizeList[2],
        percentage: oldEditorPercentage / 2,
      },
    ];

    this.mainResizer.resizeService.setResizelist(newResizeList);

    this.isPreviewOpen.set(true);
  }

  toggleFileTree() {
    if (this.isFileTreeOpen()) {
      this.collapseFileTree();
    } else {
      this.openFileTree();
    }
  }

  openFileTree() {
    const oldResizeList = this.mainResizer.resizeService.resizeList;
    const newResizeList = [
      {
        ...oldResizeList[0],
        percentage: oldResizeList[0].originPercentage,
      },
      {
        ...oldResizeList[1],
        percentage: oldResizeList[1].originPercentage,
      },
      oldResizeList[2],
    ];
    this.mainResizer.resizeService.setResizelist(newResizeList);

    this.isFileTreeOpen.set(true);
  }

  collapseFileTree() {
    const oldResizeList = this.mainResizer.resizeService.resizeList;
    const oldFileTreePercentage = oldResizeList[0].percentage;
    const oldEditorPercentage = oldResizeList[1].percentage;
    const newResizeList = [
      {
        ...oldResizeList[0],
        percentage: 0,
      },
      {
        ...oldResizeList[1],
        percentage: oldFileTreePercentage + oldEditorPercentage,
      },
      oldResizeList[2],
    ];
    this.mainResizer.resizeService.setResizelist(newResizeList);

    this.isFileTreeOpen.set(false);
  }

  // -------------------------------------------------
  // vertical split:  editor + terminal, preview + console
  toggleConsole() {
    if (this.isConsoleOpen()) {
      this.collapseConsole();
    } else {
      this.openConsole();
    }
  }

  openConsole() {
    const oldResizeList = this.outputResizer.resizeService.resizeList;
    const newResizeList = [
      {
        ...oldResizeList[0],
        percentage: oldResizeList[0].originPercentage,
      },
      {
        ...oldResizeList[1],
        percentage: oldResizeList[1].originPercentage,
      },
    ];
    this.outputResizer.resizeService.setResizelist(newResizeList);

    this.isConsoleOpen.set(true);
  }

  collapseConsole() {
    const oldResizeList = this.outputResizer.resizeService.resizeList;
    const newResizeList = [
      {
        ...oldResizeList[0],
        percentage: 100,
      },
      {
        ...oldResizeList[1],
        percentage: 0,
      },
    ];
    this.outputResizer.resizeService.setResizelist(newResizeList);

    this.isConsoleOpen.set(false);
  }

  toggleTerminal() {
    if (this.isTerminalOpen()) {
      this.collapseTerminal();
    } else {
      this.openTerminal();
    }
  }

  openTerminal() {
    const oldResizeList = this.editResizer.resizeService.resizeList;
    const newResizeList = [
      {
        ...oldResizeList[0],
        percentage: oldResizeList[0].originPercentage,
      },
      {
        ...oldResizeList[1],
        percentage: oldResizeList[1].originPercentage,
      },
    ];
    this.editResizer.resizeService.setResizelist(newResizeList);

    this.isTerminalOpen.set(true);
  }

  collapseTerminal() {
    const oldResizeList = this.editResizer.resizeService.resizeList;
    const newResizeList = [
      {
        ...oldResizeList[0],
        percentage: 100,
      },
      {
        ...oldResizeList[1],
        percentage: 0,
      },
    ];
    this.editResizer.resizeService.setResizelist(newResizeList);

    this.isTerminalOpen.set(false);
  }
}
