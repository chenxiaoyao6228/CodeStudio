import { Injectable } from '@angular/core';
import { DirectoryNode, FileSystemTree } from '@webcontainer/api';

@Injectable({
  providedIn: 'root',
})
export class GithubFileService {
  private GITHUB_API_BASE_URL = 'https://api.github.com/repos';

  constructor() {}

  validPath(path: string): boolean {
    const urlPattern =
      /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/tree\/[^\/]+\/.+/;
    return urlPattern.test(path);
  }

  async downloadFolder(path: string): Promise<FileSystemTree> {
    const { owner, repo, branch, folderPath } = this.parseGitHubUrl(path);
    return await this.fetchGitHubFolderAsFileSystemTree(
      owner,
      repo,
      branch,
      folderPath
    );
  }

  private parseGitHubUrl(url: string) {
    const urlPattern =
      /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/;
    const match = url.match(urlPattern);
    if (!match) {
      throw new Error('Invalid GitHub URL');
    }
    const [_, owner, repo, branch, folderPath] = match;
    return { owner, repo, branch, folderPath };
  }

  private async fetchGitHubFolderAsFileSystemTree(
    owner: string,
    repo: string,
    branch: string,
    folderPath: string
  ): Promise<FileSystemTree> {
    const apiUrl = `${this.GITHUB_API_BASE_URL}/${owner}/${repo}/contents/${folderPath}?ref=${branch}`;
    const response = await fetch(apiUrl);
    const files = await response.json();

    if (!Array.isArray(files)) {
      throw new Error(
        'Failed to fetch folder contents. Ensure the path is correct.'
      );
    }

    const fileSystemTree: FileSystemTree = {};

    await Promise.all(
      files.map(async (file: any) => {
        if (file.type === 'file') {
          const fileResponse = await fetch(file.download_url);
          const fileContent = await fileResponse.text();
          this.addToTree(
            fileSystemTree,
            file.path.replace(`${folderPath}/`, ''),
            fileContent
          );
        } else if (file.type === 'dir') {
          const subTree = await this.fetchGitHubFolderAsFileSystemTree(
            owner,
            repo,
            branch,
            file.path
          );
          fileSystemTree[file.name] = { directory: subTree };
        }
      })
    );

    return fileSystemTree;
  }

  private addToTree(tree: FileSystemTree, path: string, content: string) {
    const parts = path.split('/');
    const fileName = parts.pop();
    let current: FileSystemTree = tree;

    parts.forEach((part) => {
      if (!current[part]) {
        current[part] = { directory: {} };
      }
      current = (current[part] as DirectoryNode).directory;
    });

    current[fileName!] = { file: { contents: content } };
  }
}
