import { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import { getType } from 'mime'
import { readFile } from 'fs/promises'

export const createServe =
	(publicDir: string, processFile: (path: string, content: Buffer, req: IncomingMessage) => Promise<string | Buffer>) =>
		async (req: IncomingMessage, res: ServerResponse) => {
			const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
			const path = url.pathname === '/' ? 'index.html' : url.pathname.substring(1)
			const contentType = getType(path) ?? 'application/octet-stream'

			try {
				const content = await readFile(publicDir + '/' + path)
				res.setHeader('Content-Type', contentType)
				res.end(await processFile(path, content, req))
			} catch (e) {
				res.writeHead(404)
				res.end()
			}
		}
