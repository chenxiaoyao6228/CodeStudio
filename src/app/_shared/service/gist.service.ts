import { Injectable, inject } from '@angular/core';
import { Octokit } from '@octokit/rest';
import { LocalStorageService } from './local-storage.service';

export interface IGistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: string;
  size: number;
}

export interface IGistItem {
  id: string;
  description: string;
  updated_at: string;
  url: string;
  files: Record<string, IGistFile>;
}

@Injectable({
  providedIn: 'root',
})
export class GistService {
  private localStorageService = inject(LocalStorageService);

  private createOctokitInstance() {
    const token = this.localStorageService.getItem('githubToken');
    return new Octokit({ auth: token });
  }

  private handleError(error: any) {
    if (error.status === 401) {
      return {
        success: false,
        status: 401,
        message: 'Unauthorized. Please check your GitHub token.',
      };
    }
    return { success: false, status: error.status, message: error.message };
  }

  async addGist(
    params: { title: string; description: string; [key: string]: any },
    files: Record<string, { content: string }>
  ) {
    try {
      const fullDescription = stringifyDescription(params);
      const octokit = this.createOctokitInstance();
      const response = await octokit.gists.create({
        description: fullDescription,
        public: true,
        files,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }
  async deleteGist(params: { gistId: string }) {
    const octokit = this.createOctokitInstance();
    try {
      await octokit.gists.delete({ gist_id: params.gistId });
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteMultipleGists(params: { gistIds: string[] }) {
    try {
      const deletePromises = params.gistIds.map((gistId) =>
        this.deleteGist({ gistId })
      );
      await Promise.all(deletePromises);
      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateGist(params: {
    gistId: string;
    files: Record<string, { content: string }>;
  }) {
    const octokit = this.createOctokitInstance();
    try {
      const response = await octokit.gists.update({
        gist_id: params.gistId,
        files: params.files,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getGists(params: { page: number; perPage: number }) {
    const octokit = this.createOctokitInstance();
    try {
      const response = await octokit.gists.list({
        page: params.page,
        per_page: params.perPage,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

/*
 * Gist doesn't support extra keys except description from list query,
 *  so try to store them in description
 * so that we can get some extra information like title in the home page
 */
export function stringifyDescription(params: Record<string, any>): string {
  return Object.keys(params)
    .map((key) => `${key}: ${params[key]}`)
    .join('\n');
}

export function parseDescription(description: string): Record<string, any> {
  const lines = description.split('\n');
  const params: Record<string, any> = {};
  lines.forEach((line) => {
    const [key, ...rest] = line.split(': ');
    if (key) {
      params[key] = rest.join(': ');
    }
  });
  return params;
}
