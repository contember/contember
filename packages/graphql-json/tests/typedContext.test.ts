import { describe, expect, it } from 'bun:test'
import { parse } from 'graphql'
import { buildSchema, defaultFieldResolver, execute, executeSync } from '../src/index.js'
import type { IsTypeOfResolverMap, ResolverFn, ResolverMap, TypeResolverMap } from '../src/index.js'

interface AppContext {
	userName: string
}

const schema = buildSchema(`
	interface Named {
		name: String!
	}
	type User implements Named {
		name: String!
	}
	type Query {
		me: Named
		greeting: String!
	}
`)

// Everything below is typed for AppContext and type-checks without casts.
const resolvers: ResolverMap<AppContext> = {
	Query: {
		me: (_, __, context) => ({ name: context.userName }),
	},
}

const typeResolvers: TypeResolverMap<AppContext> = {
	Named: (_, context) => (context.userName ? 'User' : null),
}

const isTypeOfResolvers: IsTypeOfResolverMap<AppContext> = {
	User: (_, context) => context.userName !== '',
}

// defaultFieldResolver takes an unknown context, so it accepts AppContext as well
const fieldResolver: ResolverFn<unknown, AppContext> = (source, args, context, info) =>
	info.parentType === 'Query' ? `${info.fieldName}, ${context.userName}` : defaultFieldResolver(source, args, context, info)

describe('typed context', () => {
	it('passes the context value to typed resolvers', async () => {
		const result = await execute({
			schema,
			document: parse('{ me { __typename name } greeting }'),
			resolvers,
			typeResolvers,
			isTypeOfResolvers,
			fieldResolver,
			contextValue: { userName: 'Jane' },
		})

		expect(result).toEqual({ data: { me: { __typename: 'User', name: 'Jane' }, greeting: 'greeting, Jane' } })
	})

	it('runs introspection next to typed resolvers', () => {
		const result = executeSync({
			schema,
			document: parse('{ __type(name: "User") { name } me { name } }'),
			resolvers,
			typeResolvers,
			contextValue: { userName: 'Jane' },
		})

		expect(result).toEqual({ data: { __type: { name: 'User' }, me: { name: 'Jane' } } })
	})

	it('passes undefined to untyped resolvers when no context value is given', () => {
		const contexts: unknown[] = []
		const result = executeSync({
			schema,
			document: parse('{ greeting }'),
			resolvers: {
				Query: {
					greeting: (_, __, context) => {
						contexts.push(context)
						return 'hi'
					},
				},
			},
		})

		expect(result).toEqual({ data: { greeting: 'hi' } })
		expect(contexts).toEqual([undefined])
	})
})
