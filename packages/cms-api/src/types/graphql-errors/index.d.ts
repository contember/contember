declare module 'graphql-errors' {
	import { GraphQLSchema } from 'graphql'

	export function maskErrors(schema: GraphQLSchema, handler?: (err: Error) => void): void
}
