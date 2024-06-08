import { Injectable } from '@angular/core';
import { ResizerComponent } from './resizer';

interface ResizeItem {
  id: string;
  minSize: number;
  maxSize: number;
  width: number;
  height: number;
  resizer: ResizerComponent
}

type Direction = 'col' | 'row';

@Injectable()
export class ResizeManagerService {
  direction: Direction = 'row';
  resizeList: ResizeItem[] = [];

  setDirection(dir: Direction) {
    this.direction = dir
  }

  setResizelist(list: ResizeItem[]) {
    this.resizeList = list
  }
  updateResizelistItem(id: string, item: ResizeItem) {
    console.log("item", item);
    const index = this.resizeList.findIndex((i) => i.id === id);
    if (index !== -1) {
      this.resizeList[index] = item
    }
  }


  calculateNewSize({ id, delta }: { id: string, delta: number }) {

    const index = this.resizeList.findIndex((i) => i.id === id);

    if (index === -1) {
      return;
    }

    const sizeFlag = getSizeFlagFromDir(this.direction)

    const preEle = this.resizeList[index - 1];
    const nextEle = this.resizeList[index]; // firstElement does not have resize-bar

    const newSizeOfPrev = preEle[sizeFlag] + delta;
    const newSizeOfNext = nextEle[sizeFlag] - delta;

    if (newSizeOfPrev < preEle.minSize || newSizeOfNext < nextEle.minSize) {
      return;
    }


    this.resizeList.forEach(item => {
      if (item.id === id) {
        item[sizeFlag] = newSizeOfNext

      } else if (item.id === preEle.id) {
        item[sizeFlag] = newSizeOfPrev
      }
      const size = item[sizeFlag]
      item.resizer.updateSize({ size, sizeFlag })
    })

    function getSizeFlagFromDir(dir: Direction) {
      return dir === 'row' ? 'width' : 'height'
    }
  }
}
