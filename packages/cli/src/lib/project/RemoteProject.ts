export class RemoteProject {
	constructor(
		public readonly name: string,
		public readonly endpoint: string,
		public readonly token: string,
		public readonly adminEndpoint?: string,
	) {
	}
}
