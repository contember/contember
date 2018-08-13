import GraphqlClient from './GraphqlClient'

export default class ContentClientFactory {
	constructor(private baseUrl: string) {}

	create(project: string, name: string) {
		return new GraphqlClient(`${this.baseUrl}/content/${project}/${name}`)
	}
}
