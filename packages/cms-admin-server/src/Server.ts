import Koa from 'koa'
import render from './index.html'
import koaStatic from 'koa-static'

export default class Server {
	async run(config: any) {
		const koa = new Koa()
		koa.use(koaStatic(process.cwd() + '/public'))
		koa.use(async (ctx, next) => {
			if (ctx.accepts('html')) {
				ctx.body = render({ config: config.admin, assets: config.assets.index })
			} else {
				await next()
			}
		})
		koa.listen(config.server.port, () => {
			console.log(`Listening on http://localhost:${config.server.port}`)
		})
	}
}
