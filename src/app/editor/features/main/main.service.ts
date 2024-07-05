import { Injectable, signal } from '@angular/core';

@Injectable()
export class MainService {
  mainResizer: any;
  isPreviewOpen = signal(true);
  setResizer(resizer: any) {
    this.mainResizer = resizer;
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
}
