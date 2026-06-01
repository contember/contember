import { TenantClient } from './tenant/TenantClient.js'
import { RemoteProjectProvider } from './project/RemoteProjectProvider.js'

export class TenantClientProvider {
	constructor(
		private readonly remoteProjectProvider: RemoteProjectProvider,
	) {
	}

	public get(): TenantClient {
		const project = this.remoteProjectProvider.get()
		return TenantClient.create(project.endpoint, project.token)
	}
}
