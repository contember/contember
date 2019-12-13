declare module 'graphql-errors' {
	import { GraphQLSchema } from 'graphql'

	export function maskErrors(schema: GraphQLSchema, handler?: (err: Error) => any): void

	export class UserError extends Error {}
}
