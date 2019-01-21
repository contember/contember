import * as Koa from 'koa'
import * as koaCompose from 'koa-compose'
import { route } from '../core/koa/router'
import { ProjectContainer } from '../CompositionRoot'

export default class SystemMiddlewareFactory {
	constructor(private projectContainers: ProjectContainer[]) {}

	create(): Koa.Middleware {
		return route('/system/:projectSlug$', async (ctx, next) => {
			const systemKoa = new Koa()

			const projectContainer = this.projectContainers.find(projectContainer => {
				return projectContainer.get('project').slug === ctx.state.params.projectSlug
			})

			if (projectContainer === undefined) {
				return ctx.throw(404, `Project ${ctx.state.params.projectSlug} NOT found`)
			}
			const server = projectContainer.get('systemApollo')
			server.applyMiddleware({
				app: systemKoa,
				path: '/',
			})
			await koaCompose(systemKoa.middleware)(ctx, next)
		})
	}
}
