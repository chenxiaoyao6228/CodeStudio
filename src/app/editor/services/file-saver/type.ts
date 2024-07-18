export interface IStorage {
  save(content: Blob, filename: string, extraParams?: Record<string, any>): Promise<void>;
}
