import { stringifyDescription } from "@src/app/_shared/service/gist.service";
import { IStorage } from "../type";

export class GistStorage implements IStorage {
    constructor(private token: string) { }

    async save(content: Blob, filename: string, extraParams?: Record<string, any>): Promise<void> {
        const description = extraParams ? extraParams['description'] : '';
        const fullDescription = stringifyDescription({
            ...extraParams,
            title: filename,
            description
        });
        const reader = new FileReader();
        reader.readAsDataURL(content);
        reader.onload = async () => {
            const data = {
                description: fullDescription,
                files: {
                    [filename]: {
                        content: reader.result as string,
                        encoding: 'base64',
                    },
                    'codestudio.json': {
                        content: JSON.stringify(this.genMetaData())
                    }
                },
                public: true,
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
    createDescription() {
        return 'meta data description for code-studio'
    }

    private genMetaData() {
        const now = new Date();
        const meta = {
            "title": "untitled",
            "description": this.createDescription(),
            "created_at": now.toISOString().replace('T', ' ').split('.')[0],
            "updated_at": now.toISOString().replace('T', ' ').split('.')[0]
        };
        return meta
    }
}
