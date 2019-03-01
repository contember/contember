import GraphqlClient from './GraphqlClient'

export default class SystemClientFactory {
	constructor(private baseUrl: string) {}

	create(project: string) {
		return new GraphqlClient(`${this.baseUrl}/system/${project}`)
	}
}
