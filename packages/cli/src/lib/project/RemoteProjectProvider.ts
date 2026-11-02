import { CliError, ExitCode } from '@contember/cli-common'
import { RemoteProject } from './RemoteProject.js'

export class RemoteProjectProvider {
	private _remoteProject: RemoteProject | undefined = undefined

	/** @param resolveDefault resolves the env project on first access, so a credential error surfaces only in commands that connect */
	constructor(
		private readonly resolveDefault?: () => RemoteProject | undefined,
	) {
	}

	public setRemoteProject(remoteProject: RemoteProject) {
		this._remoteProject = remoteProject
	}

	public get(): RemoteProject {
		this._remoteProject ??= this.resolveDefault?.()
		if (!this._remoteProject) {
			// the env resolves to no project — a user mistake, not a bug
			throw new CliError('Project not defined. Set CONTEMBER_DSN, or CONTEMBER_API_URL, CONTEMBER_API_TOKEN and CONTEMBER_PROJECT_NAME.', {
				code: 'PROJECT_NOT_DEFINED',
				exitCode: ExitCode.InputError,
			})
		}
		return this._remoteProject
	}
}
