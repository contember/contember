import {
	RenderPageOptions as PlaygroundRenderPageOptions,
	renderPlaygroundPage,
} from '@apollographql/graphql-playground-html'
import accepts from 'accepts'
import { get, KoaContext, KoaMiddleware, KoaRequestState } from '../koa'

const sandboxTabs: PlaygroundRenderPageOptions['tabs'] = [
	{
		endpoint: '/content/sandbox/live',
		name: 'Create a post',
		variables: JSON.stringify({
			post: {
				title: 'Hello Contember',
				content:
					'Contember is a headless, GraphQL-first platform for building custom web applications. Prototype yours in a day, launch it in a week and run it for years.',
			},
		}),
		query: `mutation($post: PostCreateInput!) {
	createPost(data: $post) {
		ok
		errorMessage
		node {
			id
			title
		}
	}
}`,
		headers: {
			Authorization: 'Bearer 0000000000000000000000000000000000000000',
		},
	},
	{
		endpoint: '/content/sandbox/live',
		name: 'List posts',
		query: `query {
	listPost {
		title
	}
}`,
		headers: {
			Authorization: 'Bearer 0000000000000000000000000000000000000000',
		},
	},
]

export const createPlaygroundMiddleware = (sandbox = false): KoaMiddleware<KoaRequestState> => {
	return get('/', (ctx: KoaContext<KoaRequestState>, next) => {
		const accept = accepts(ctx.req)
		const types = accept.types() as string[]
		const prefersHTML = types.find((x: string) => x === 'text/html' || x === 'application/json') === 'text/html'
		if (!prefersHTML) {
			return next()
		}
		const playgroundRenderPageOptions: PlaygroundRenderPageOptions = {
			endpoint: ctx.originalUrl,
		}
		if (sandbox) {
			playgroundRenderPageOptions.tabs = sandboxTabs
		}

		ctx.set('Content-Type', 'text/html')
		ctx.body = renderPlaygroundPage(playgroundRenderPageOptions)
	})
}
