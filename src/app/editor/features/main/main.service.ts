import { Injectable, signal } from '@angular/core';

@Injectable()
export class MainService {
  mainResizer: any;
  outputResizer: any;
  isPreviewOpen = signal(true);
  isConsoleOpen = signal(true);
  setMainResizer(resizer: any) {
    this.mainResizer = resizer;
  }
  setOutputResizer(resizer: any) {
    this.outputResizer = resizer;
  }

  collapsePreview() {
    const oldResizeList = this.mainResizer.resizeService.resizeList;
    const oldEditorPercentage = oldResizeList[1].percentage;
    const oldPreviewPercentage = oldResizeList[2].percentage;
    const newResizeLit = [
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

    this.mainResizer.resizeService.setResizelist(newResizeLit);

    this.isPreviewOpen.set(false);
  }
  openPreview() {
    const oldResizeList = this.mainResizer.resizeService.resizeList;
    const oldEditorPercentage = oldResizeList[1].percentage;
    const newResizeLit = [
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

    this.mainResizer.resizeService.setResizelist(newResizeLit);

    this.isPreviewOpen.set(true);
  }

  toggleConsole() {
    if (this.isConsoleOpen()) {
      this.collapseConsole();
    } else {
      this.openConsole();
    }
  }

  openConsole() {
    const oldResizeList = this.outputResizer.resizeService.resizeList;
    const newResizeLit = [
      {
        ...oldResizeList[0],
        percentage: oldResizeList[0].originPercentage,
      },
      {
        ...oldResizeList[1],
        percentage: oldResizeList[1].originPercentage,
      },
    ];
    this.outputResizer.resizeService.setResizelist(newResizeLit);

    this.isConsoleOpen.set(true);
  }
  collapseConsole() {
    const oldResizeList = this.outputResizer.resizeService.resizeList;
    const newResizeLit = [
      {
        ...oldResizeList[0],
        percentage: 100,
      },
      {
        ...oldResizeList[1],
        percentage: 0,
      },
    ];
    this.outputResizer.resizeService.setResizelist(newResizeLit);

    this.isConsoleOpen.set(false);
  }
}
