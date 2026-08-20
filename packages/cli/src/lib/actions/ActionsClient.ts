import type { JsonValue } from '@contember/cli-common'
import { GraphQlClient, GraphQlClientVariables } from '@contember/graphql-client'
import { toTransportError } from '../errors/TransportError.js'

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
		const result = await this.execute<{
			variables: Array<{ name: string; value: string }>
		}>(query)
		return result.variables
	}

	public async setVariables(variables: { name: string; value: string }[], mode: SetVariablesMode): Promise<boolean> {
		const query = `mutation($variables: [VariableInput!]!, $mode: SetVariablesMode) {
  setVariables(args: { variables: $variables, mode: $mode }) {
	ok
  }
  }`
		const result = await this.execute<{ setVariables: { ok: boolean } }>(query, { mode, variables })
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
		const result = await this.execute<{
			failedEvents: Event[]
		}>(query, { offset, limit })
		return result.failedEvents
	}

	public async retryEvent(id: string): Promise<boolean> {
		const query = `mutation($id: UUID!) {
  retryEvent(id: $id) {
  	ok
  }
}`
		const result = await this.execute<{ retryEvent: { ok: boolean } }>(query, { id })
		return result.retryEvent.ok
	}

	public async stopEvent(id: string): Promise<boolean> {
		const query = `mutation($id: UUID!) {
  stopEvent(id: $id) {
  	ok
  }
}`
		const result = await this.execute<{ stopEvent: { ok: boolean } }>(query, { id })
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
		const result = await this.execute<{ event: Event | null }>(query, { id })
		return result.event
	}

	private async execute<T>(query: string, variables?: GraphQlClientVariables): Promise<T> {
		try {
			return await this.apiClient.execute<T>(query, variables === undefined ? {} : { variables })
		} catch (error) {
			throw toTransportError(error, {
				service: 'Actions API',
				codePrefix: 'ACTIONS_API',
			})
		}
	}
}

/** The subset of ActionsClient commands depend on — structural, so tests can pass a plain fake without a cast. */
export type ActionsApi = Pick<ActionsClient, 'listVariables' | 'setVariables' | 'listFailedEvents' | 'retryEvent' | 'stopEvent' | 'getEvent'>

export type SetVariablesMode = 'MERGE' | 'SET' | 'APPEND_ONLY_MISSING'

export type Event = {
	id: string
	createdAt: string
	lastStateChange: string
	visibleAt: string | null
	numRetries: number
	state: 'created' | 'retrying' | 'processing' | 'succeed' | 'failed' | 'stopped'
	target: string
	payload: JsonValue
	log: JsonValue
}
