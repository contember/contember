import { GraphQlClient, GraphQlClientOptions } from '@contember/graphql-client'
import { ApiBaseUrlContext, GraphQlClientFactoryContext, LoginTokenContext } from '@contember/react-client'
import { graphql, GraphQLSchema, parse, validate } from 'graphql'
import { ReactNode } from 'react'

export type TenantApiRequest = { query: string; variables: Record<string, unknown> }

const jsonResponse = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

// A tenant API that answers like a GraphQL server: a query the schema rejects gets a 400, a valid one is executed.
export const createTenantApiWrapper = (schema: GraphQLSchema, rootValue: object) => {
	const requests: TenantApiRequest[] = []
	const fetcher = async (_input: RequestInfo, init?: RequestInit): Promise<Response> => {
		const { query, variables } = JSON.parse(String(init?.body))
		requests.push({ query, variables })
		const errors = validate(schema, parse(query))
		if (errors.length > 0) {
			return jsonResponse(400, { errors: errors.map(it => ({ message: it.message })) })
		}
		return jsonResponse(200, await graphql({ schema, source: query, variableValues: variables, rootValue }))
	}
	const clientFactory = (options: GraphQlClientOptions) => new GraphQlClient({ ...options, fetcher })

	const wrapper = ({ children }: { children: ReactNode }) => (
		<ApiBaseUrlContext.Provider value="http://localhost">
			<LoginTokenContext.Provider value="login-token">
				<GraphQlClientFactoryContext.Provider value={clientFactory}>
					{children}
				</GraphQlClientFactoryContext.Provider>
			</LoginTokenContext.Provider>
		</ApiBaseUrlContext.Provider>
	)
	return { wrapper, requests }
}
