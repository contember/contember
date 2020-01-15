import Koa from 'koa'
import koaStatic from 'koa-static'
import * as fs from 'fs'
import { promisify } from 'util'
import { Server as HttpServer } from 'net'

const readFile = promisify(fs.readFile)

export interface Configuration {
	port: number
	indexFile: string
	apiBaseUrl: string
	loginToken: string
	configPlaceholder: string
}

export default class Server {
	async run({ indexFile, apiBaseUrl, loginToken, configPlaceholder, port }: Configuration): Promise<HttpServer> {
		let file: string
		const koa = new Koa()
		koa.use(koaStatic(process.cwd() + '/public', { index: false }))
		koa.use(async (ctx, next) => {
			if (ctx.accepts('html')) {
				if (!file) {
					file = await readFile(indexFile, { encoding: 'utf8' })
				}
				ctx.body = file.replace(configPlaceholder, JSON.stringify({ apiBaseUrl, loginToken }))
			} else {
				await next()
			}
		})
		return koa.listen(port, () => {
			console.log(`Listening on http://localhost:${port}`)
		})
	}
}
