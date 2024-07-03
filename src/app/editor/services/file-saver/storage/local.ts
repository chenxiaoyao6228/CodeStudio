
import { saveAs } from 'file-saver';
import { IStorage } from '../type';

export class LocalStorage implements IStorage {
    async save(content: Blob, filename: string): Promise<void> {
        saveAs(content, filename);
    }
}
