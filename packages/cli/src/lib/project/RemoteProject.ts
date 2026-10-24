import type { ApiCredentials } from '../credentials/ApiCredentials.js'

export class RemoteProject {
	constructor(
		public readonly name: string,
		public readonly endpoint: string,
		public readonly credentials: ApiCredentials,
		public readonly adminEndpoint?: string,
	) {
	}
}
