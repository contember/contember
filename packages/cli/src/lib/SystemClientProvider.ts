import { RemoteProjectProvider } from './project/RemoteProjectProvider'
import { SystemClient } from '@contember/migrations-client'

export class SystemClientProvider {
	constructor(
		private readonly remoteProjectProvider: RemoteProjectProvider,
	) {
	}

	public get(): SystemClient {
		const project = this.remoteProjectProvider.get()
		return SystemClient.create(project.endpoint, project.name, project.token)
	}
}
