import { Injectable } from '@angular/core';
import { IStorage } from '../type';

@Injectable({ providedIn: 'root' })
export class LocalStorage implements IStorage {
  async save(zipBlob: Blob, filename: string): Promise<void> {
    if ('showSaveFilePicker' in window) {
      try {
        const options = {
          suggestedName: filename,
          types: [
            {
              description: 'code studio project',
              accept: {
                'application/zip': ['.zip'],
              },
            },
          ],
        };
        const handle = await (window as any).showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(zipBlob);
        await writable.close();
      } catch (error) {
        console.error('Error saving file:', error);
      }
    } else {
      this.saveUsingAnchor(zipBlob, filename);
    }
  }

  private saveUsingAnchor(content: Blob, filename: string) {
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }
}
