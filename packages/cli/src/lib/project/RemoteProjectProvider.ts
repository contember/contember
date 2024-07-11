import { RemoteProject } from './RemoteProject'

export class RemoteProjectProvider {
	private _remoteProject: RemoteProject | undefined = undefined

	public setRemoteProject(remoteProject: RemoteProject) {
		this._remoteProject = remoteProject
	}

	public get(): RemoteProject {
		if (!this._remoteProject) {
			throw new Error('Remote project not set')
		}
		return this._remoteProject
	}
}
