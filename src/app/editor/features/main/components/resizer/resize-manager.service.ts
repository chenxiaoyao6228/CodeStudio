import { Injectable } from '@angular/core';
import { ResizerComponent } from './resizer';

interface ResizeItem {
  id: string;
  minSize: number;
  maxSize: number;
  width: number;
  height: number;
  resizer: ResizerComponent;
  percentage: number;
}

type Direction = 'col' | 'row';

@Injectable()
export class ResizeManagerService {
  direction: Direction = 'row';
  resizeList: ResizeItem[] = [];
  containerSize: { width: number; height: number } = { width: 0, height: 0 };

  setDirection(dir: Direction) {
    this.direction = dir;
  }

  setContainerSize({ width, height }: { width: number; height: number }) {
    this.containerSize = { width, height };
  }

  setResizelist(list: ResizeItem[]) {
    this.resizeList = list;

    let percentage = 0;
    this.resizeList.forEach((item) => {
      percentage += item.percentage;
      if (percentage > 100) {
        throw new Error('resizer percentage sum > 100');
      }
      item.width = this.direction === 'row' ? item.percentage : 100;
      item.height = this.direction === 'col' ? item.percentage : 100;
      item.resizer.updateSize('width', item.width);
      item.resizer.updateSize('height', item.height);
    });
  }

  calculateNewSize({ id, delta: _delta }: { id: string; delta: number }) {
    const delta =
      (_delta / this.containerSize[this.getSizeFlagFromDir()]) * 100;

    const index = this.resizeList.findIndex((i) => i.id === id);

    if (index === -1) {
      return;
    }

    const sizeFlag = getSizeFlagFromDir(this.direction);

    const preEle = this.resizeList[index - 1];
    const nextEle = this.resizeList[index]; // firstElement does not have resize-bar

    const newSizeOfPrev = preEle[sizeFlag] + delta;
    const newSizeOfNext = nextEle[sizeFlag] - delta;

    if (
      newSizeOfPrev < preEle.minSize / preEle[sizeFlag] ||
      newSizeOfNext < nextEle.minSize / nextEle[sizeFlag]
    ) {
      return;
    }

    this.resizeList.forEach((item) => {
      if (item.id === id) {
        item[sizeFlag] = newSizeOfNext;
      } else if (item.id === preEle.id) {
        item[sizeFlag] = newSizeOfPrev;
      }
    });
    this.resizeList.forEach((item) => {
      item.resizer.updateSize(sizeFlag, item[sizeFlag]);
    });

    function getSizeFlagFromDir(dir: Direction) {
      return dir === 'row' ? 'width' : 'height';
    }
  }
  getSizeFlagFromDir() {
    return this.direction === 'row' ? 'width' : 'height';
  }
}
