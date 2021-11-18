import fetch, { Response } from 'node-fetch'
import { readdir, readFile } from 'fs/promises'

export class AdminClient {
	constructor(private readonly url: string, private readonly apiToken: string) {}

	public static create(url: string, apiToken: string): AdminClient {
		return new AdminClient(url, apiToken)
	}

	public async deploy(project: string, files: AdminFiles): Promise<void> {
		const response = await this.execute('_deploy', 'POST', { project, files })

		if (!response.ok) {
			throw `Failed to deploy admin, POST request to ${this.url}/_deploy returned status ${response.status} ${response.statusText}`
		}
	}

	private async execute(path: string, method: string, body: any): Promise<Response> {
		return await fetch(`${this.url}/${path}`, {
			method: method,
			headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiToken}` },
			body: JSON.stringify(body),
		})
	}
}

export type AdminFiles = Array<{ path: string; data: string }>
export const readAdminFiles = async (dir: string, prefix: string = ''): Promise<AdminFiles> => {
	const files = []
	for (const fileName of await readdir(dir, { withFileTypes: true })) {
		if (fileName.isDirectory()) {
			const subFiles = await readAdminFiles(`${dir}/${fileName.name}`, prefix + fileName.name + '/')
			files.push(...subFiles)
		} else if (fileName.isFile()) {
			files.push({
				path: prefix + fileName.name,
				data: (await readFile(`${dir}/${fileName.name}`)).toString('base64'),
			})
		}
	}

	return files
}
