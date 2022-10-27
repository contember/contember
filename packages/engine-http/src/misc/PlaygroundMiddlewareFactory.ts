import { renderPlaygroundPage } from '@apollographql/graphql-playground-html'
import { HttpController } from '../application'
import { HttpResponse } from '../common'

export const playgroundController: HttpController = ctx =>
	new HttpResponse(
		200,
		renderPlaygroundPage({
			endpoint: ctx.path,
		}),
		'text/html',
	)
