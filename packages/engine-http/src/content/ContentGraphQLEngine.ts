import { JsonContentSchema } from '@contember/engine-content-api'
import { GraphQLSchema } from 'graphql'

export type ContentGraphQLEngine = 'graphql-js' | 'graphql-json'

export type ContentGraphQLSchema =
	| { engine: 'graphql-js'; schema: GraphQLSchema }
	| { engine: 'graphql-json'; schema: JsonContentSchema }

/** The engine that serves a project's content API: the listed projects run on graphql-json, the others on the default. */
export class ContentGraphQLEngineResolver {
	private readonly graphqlJsonProjects: ReadonlySet<string>

	constructor(
		private readonly defaultEngine: ContentGraphQLEngine = 'graphql-js',
		graphqlJsonProjects: readonly string[] = [],
	) {
		this.graphqlJsonProjects = new Set(graphqlJsonProjects)
	}

	public resolve(projectSlug: string): ContentGraphQLEngine {
		return this.graphqlJsonProjects.has(projectSlug) ? 'graphql-json' : this.defaultEngine
	}
}
