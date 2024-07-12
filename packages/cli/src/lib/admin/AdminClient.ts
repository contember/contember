import { maskToken } from '../maskToken'
import { RemoteProjectProvider } from '../project/RemoteProjectProvider'

export type AdminFiles = Array<{ path: string; data: string }>
export class AdminClient {
	constructor(
		private readonly remoteProjectProvider: RemoteProjectProvider,
	) {
	}

	public async deploy(project: string | null, files: AdminFiles): Promise<void> {
		const response = await this.execute('_deploy', 'POST', { project, files })

		if (!response.ok) {
			const project = this.remoteProjectProvider.get()
			const maskedToken = maskToken(project.token)
			throw `Failed to deploy admin, POST request to ${project.endpoint}/_deploy with token ${maskedToken} returned status ${response.status} ${response.statusText}\n${await response.text()}`
		}
	}

	private async execute(path: string, method: string, body: any): Promise<Response> {
		const project = this.remoteProjectProvider.get()
		if (!project.adminEndpoint) {
			throw new Error('Admin endpoint not set')
		}
		return await fetch(`${project.adminEndpoint}/${path}`, {
			method: method,
			headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${project.token}` },
			body: JSON.stringify(body),
		})
	}

}
