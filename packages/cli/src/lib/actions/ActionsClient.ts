import { GraphQlClient } from '@contember/graphql-client'

const createActionsApiUrl = (url: string, project: string) => {
	if (url.endsWith('/')) {
		url = url.substring(0, url.length - 1)
	}

	return url + '/actions/' + project
}
export class ActionsClient {
	constructor(private readonly apiClient: GraphQlClient) {
	}

	public static create(url: string, project: string, apiToken: string): ActionsClient {
		const graphqlClient = new GraphQlClient({ url: createActionsApiUrl(url, project), apiToken })
		return new ActionsClient(graphqlClient)
	}

	public async listVariables(): Promise<{ name: string; value: string }[]> {
		const query = `query {
  variables {
  	name
  	value
  }
}`
		const result = await this.apiClient.execute<{
			variables: Array<{ name: string; value: string }>
		}>(query)
		return result.variables
	}

	public async setVariables(variables: { name: string; value: string }[], mode: 'MERGE' | 'SET' | 'APPEND_ONLY_MISSING'): Promise<boolean> {
		const query = `mutation($variables: [VariableInput!]!, $mode: SetVariablesMode) {
  setVariables(args: { variables: $variables, mode: $mode }) {
	ok
  }
  }`
		const result = await this.apiClient.execute<{ setVariables: { ok: boolean } }>(query, { variables: { mode, variables } })
		return result.setVariables.ok
	}

	public async listFailedEvents({ offset, limit }: { offset?: number; limit?: number } = {}): Promise<Event[]> {
		const query = `query($offset: Int, $limit: Int) {
  failedEvents(args: { offset: $offset, limit: $limit }) {
  	id
  	createdAt
  	lastStateChange
  	visibleAt
  	numRetries
  	state
  	target
  	payload
  	log
  }
}`
		const result = await this.apiClient.execute<{
			failedEvents: Event[]
		}>(query, { variables: { offset, limit } })
		return result.failedEvents
	}

	public async retryEvent(id: string): Promise<boolean> {
		const query = `mutation($id: UUID!) {
  retryEvent(id: $id) {
  	ok
  }
}`
		const result = await this.apiClient.execute<{ retryEvent: { ok: boolean } }>(query, { variables: { id } })
		return result.retryEvent.ok
	}

	public async stopEvent(id: string): Promise<boolean> {
		const query = `mutation($id: UUID!) {
  stopEvent(id: $id) {
  	ok
  }
}`
		const result = await this.apiClient.execute<{ stopEvent: { ok: boolean } }>(query, { variables: { id } })
		return result.stopEvent.ok
	}


	public async getEvent(id: string): Promise<Event | null> {
		const query = `query($id: UUID!) {
  event(id: $id) {
  	id
  	createdAt
  	lastStateChange
  	visibleAt
  	numRetries
  	state
  	target
  	payload
  	log
  }
}`
		const result = await this.apiClient.execute<{ event: Event | null }>(query, { variables: { id } })
		return result.event
	}
}

export type Event = {
	id: string
	createdAt: string
	lastStateChange: string
	visibleAt: string | null
	numRetries: number
	state: 'retrying' | 'failed'
	target: string
	payload: any
	log: any
}
