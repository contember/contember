import { TenantClient } from './tenant/TenantClient'
import { RemoteProjectProvider } from './project/RemoteProjectProvider'

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
