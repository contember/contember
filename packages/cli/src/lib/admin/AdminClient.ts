import { CliError, ExitCode } from '@contember/cli-common'
import { toHttpTransportError, toTransportError } from '../errors/TransportError.js'
import { RemoteProjectProvider } from '../project/RemoteProjectProvider.js'

export type AdminFiles = Array<{ path: string; data: string }>
interface AdminDeployRequest {
	readonly project: string | null
	readonly files: AdminFiles
}

export class AdminClient {
	constructor(
		private readonly remoteProjectProvider: RemoteProjectProvider,
	) {
	}

	public async deploy(project: string | null, files: AdminFiles): Promise<void> {
		const response = await this.execute('_deploy', 'POST', { project, files })

		if (!response.ok) {
			try {
				await response.body?.cancel()
			} catch {
				// The HTTP classification is the primary error.
			}
			throw toHttpTransportError(
				{ status: response.status, retryAfter: response.headers.get('retry-after') },
				this.context('_deploy'),
			)
		}
	}

	private async execute(path: string, method: string, body: AdminDeployRequest): Promise<Response> {
		const project = this.remoteProjectProvider.get()
		if (!project.adminEndpoint) {
			throw new CliError('Admin endpoint not set', {
				code: 'ADMIN_ENDPOINT_NOT_SET',
				exitCode: ExitCode.InputError,
			})
		}
		try {
			return await fetch(`${project.adminEndpoint}/${path}`, {
				method,
				headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${project.token}` },
				body: JSON.stringify(body),
			})
		} catch (error) {
			throw toTransportError(error, this.context(path))
		}
	}

	private context(path: string) {
		const endpoint = this.remoteProjectProvider.get().adminEndpoint
		return {
			service: 'Admin API',
			codePrefix: 'ADMIN_API',
			...(endpoint === undefined ? {} : { url: `${endpoint}/${path}` }),
		}
	}
}
