import { RemoteProjectProvider } from './project/RemoteProjectProvider.js'
import { SystemClient } from '@contember/migrations-client'
import { GraphQlClient, GraphQlClientError } from '@contember/graphql-client'
import { toTransportError, TransportErrorContext } from './errors/TransportError.js'

type SystemClientFactory = (baseUrl: string, projectName: string, apiToken: string) => SystemClient

export class SystemClientProvider {
	constructor(
		private readonly remoteProjectProvider: RemoteProjectProvider,
		private readonly systemClientFactory: SystemClientFactory = SystemClient.create,
	) {
	}

	public get(): SystemClient {
		const project = this.remoteProjectProvider.get()
		return new TransportSystemClient(
			this.systemClientFactory(project.endpoint, project.name, project.token),
			createSystemApiUrl(project.endpoint, project.name),
		)
	}
}

class TransportSystemClient extends SystemClient {
	private readonly context: TransportErrorContext

	constructor(
		private readonly inner: SystemClient,
		apiUrl: string,
	) {
		super(new GraphQlClient({ url: apiUrl }))
		this.context = {
			service: 'System API',
			codePrefix: 'SYSTEM_API',
			url: apiUrl,
		}
	}

	public override migrate(...args: Parameters<SystemClient['migrate']>): ReturnType<SystemClient['migrate']> {
		return this.execute(() => this.inner.migrate(...args))
	}

	public override migrateFromSnapshot(
		...args: Parameters<SystemClient['migrateFromSnapshot']>
	): ReturnType<SystemClient['migrateFromSnapshot']> {
		return this.execute(() => this.inner.migrateFromSnapshot(...args))
	}

	public override migrationDelete(
		...args: Parameters<SystemClient['migrationDelete']>
	): ReturnType<SystemClient['migrationDelete']> {
		return this.execute(() => this.inner.migrationDelete(...args))
	}

	public override migrationModify(
		...args: Parameters<SystemClient['migrationModify']>
	): ReturnType<SystemClient['migrationModify']> {
		return this.execute(() => this.inner.migrationModify(...args))
	}

	public override listExecutedMigrations(
		...args: Parameters<SystemClient['listExecutedMigrations']>
	): ReturnType<SystemClient['listExecutedMigrations']> {
		return this.execute(() => this.inner.listExecutedMigrations(...args))
	}

	public override getExecutedMigration(
		...args: Parameters<SystemClient['getExecutedMigration']>
	): ReturnType<SystemClient['getExecutedMigration']> {
		return this.execute(() => this.inner.getExecutedMigration(...args))
	}

	private async execute<T>(request: () => Promise<T>): Promise<T> {
		try {
			return await request()
		} catch (error) {
			if (error instanceof GraphQlClientError) {
				throw toTransportError(error, this.context)
			}
			throw error
		}
	}
}

const createSystemApiUrl = (baseUrl: string, projectName: string): string => {
	const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
	return `${normalizedBaseUrl}/system/${projectName}`
}
