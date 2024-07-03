import { IStorage } from "../type";

export class GistStorage implements IStorage {
    constructor(private token: string) { }

    async save(content: Blob, filename: string): Promise<void> {
        const reader = new FileReader();
        reader.readAsText(content);
        reader.onload = async () => {
            const data = {
                files: {
                    [filename]: {
                        content: reader.result as string,
                    },
                },
                public: false,
            };

            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `token ${this.token}`,
                },
                body: JSON.stringify(data),
            });

            // TODO: 处理token过期等问题
            if (!response.ok) {
                throw new Error(`Failed to upload gist: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Gist created:', result.html_url);
        };
    }
}
