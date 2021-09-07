import { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import { getType } from 'mime'
import { readFile } from 'fs/promises'

export type ProcessFile = (path: string, content: Buffer, req: IncomingMessage) => Promise<string | Buffer>

export interface StaticFileHandlerOptions {
	basePath?: string
	fileProcessor?: ProcessFile
}

export class StaticFileHandler {
	constructor(private publicDir: string) {}

	public async serve(req: IncomingMessage, res: ServerResponse, options: StaticFileHandlerOptions = {}): Promise<void> {
		const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
		const basePath = options.basePath ?? '/'
		const path = url.pathname.includes('.') ? url.pathname : basePath + 'index.html'
		const contentType = getType(path) ?? 'application/octet-stream'

		try {
			const content = await readFile(this.publicDir + path)
			res.setHeader('Content-Type', contentType)
			if (options.fileProcessor) {
				res.end(await options.fileProcessor(path.slice(basePath.length), content, req))
			} else {
				res.end(content)
			}
		} catch (e) {
			res.writeHead(404)
			res.end()
		}
	}
}
