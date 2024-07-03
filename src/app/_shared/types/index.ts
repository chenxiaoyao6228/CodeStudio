import { FileSystemTree } from "@webcontainer/api"

export interface IStudioAsset {
    meta: Record<string, any>
    files: FileSystemTree
}