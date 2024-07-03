export interface IStorage {
    save(content: Blob, filename: string): Promise<void>;
}
