import { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import mime from 'mime'
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
		const contentType = mime.getType(path) ?? 'application/octet-stream'

		let content: Buffer
		try {
			content = await readFile(this.publicDir + path)
		} catch (e) {
			res.writeHead(404)
			return res.end()
		}

		res.setHeader('Content-Type', contentType)
		if (options.fileProcessor) {
			const processed = await options.fileProcessor(path.slice(basePath.length), content, req)
			res.end(processed)
		} else {
			res.end(content)
		}
	}
}
