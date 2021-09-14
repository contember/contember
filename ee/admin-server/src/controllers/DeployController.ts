import type { IncomingMessage, ServerResponse } from 'http'
import { array, object, ParseError, string } from '../schema'
import { BaseController } from './BaseController'
import type { TenantApi } from '../tenant'
import type { S3Manager } from '../s3'

type PayloadType = ReturnType<typeof PayloadType>
const PayloadType = object({
	project: string,
	files: array(
		object({
			path: string,
			data: string,
		}),
	),
})

const SIMPLE_PATH = /^[\w-]+(?:\.[\w-]+)*(?:\/[\w-]+(?:\.[\w-]+)*)*$/

export class DeployController extends BaseController {
	constructor(private tenant: TenantApi, private s3: S3Manager) {
		super()
	}

	async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		let payload: PayloadType

		try {
			payload = await this.readJsonBody(req, PayloadType)
		} catch (e) {
			if (e instanceof SyntaxError || e instanceof ParseError) {
				res.writeHead(400)
				res.end(`Invalid JSON: ${e.message}`)
				return
			} else {
				throw e
			}
		}

		const token = this.readBearerToken(req)

		if (token === null) {
			res.writeHead(400)
			res.end('missing bearer token')
			return
		}

		if (!(await this.tenant.hasProjectAccess(token, payload.project))) {
			res.writeHead(403)
			res.end(`provided token is not authorized to access project ${payload.project}`)
			return
		}

		const filesWithWrongPath = payload.files.filter(file => !SIMPLE_PATH.test(file.path))
		if (filesWithWrongPath.length > 0) {
			res.writeHead(400)
			res.end('invalid file path:\n' + filesWithWrongPath.map(it => it.path).join('\n'))
			return
		}

		const batches = [
			payload.files.filter(it => it.path !== 'index.html'),
			payload.files.filter(it => it.path === 'index.html'),
		]

		for (const batch of batches) {
			await Promise.all(
				batch.map(async file => {
					// TODO: handle error?
					await this.s3.putObject(payload.project, file.path, new Buffer(file.data, 'base64'))
				}),
			)
		}

		res.writeHead(200)
		res.end('OK')
	}
}
