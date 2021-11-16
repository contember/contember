import type { IncomingMessage, OutgoingMessage, ServerResponse } from 'http'
import type { Json, Type } from '../utils/schema'
import { Buffer } from 'buffer'
import * as cookie from 'cookie'
import { isRequestSecure } from '../utils/forwared'

const CONTEMBER_TOKEN_COOKIE_NAME = 'CONTEMBER_TOKEN'

export abstract class BaseController<T = {}> {
	abstract handle(req: IncomingMessage, res: ServerResponse, params: T): Promise<void>

	protected readBearerToken(req: IncomingMessage): string | null {
		if (req.headers.authorization === undefined) {
			return null
		}

		const [type, token] = req.headers.authorization.split(' ', 2)

		if (type !== 'Bearer' || token === undefined) {
			return null
		}

		return token
	}

	protected readAuthCookie(req: IncomingMessage): string | null {
		const cookies = cookie.parse(req.headers.cookie || '')
		return cookies[CONTEMBER_TOKEN_COOKIE_NAME] ?? null
	}

	protected writeAuthCookie(req: IncomingMessage, res: OutgoingMessage, token: string): void {
		res.setHeader(
			'Set-Cookie',
			cookie.serialize(CONTEMBER_TOKEN_COOKIE_NAME, token, {
				path: '/',
				httpOnly: true,
				secure: isRequestSecure(req),
				sameSite: 'lax',
				expires: new Date(Date.now() + 14 * 24 * 3600 * 1000),
			}),
		)
	}

	protected readRawBody(req: IncomingMessage): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = []

			req.on('data', chunk => chunks.push(chunk))

			req.on('end', () => {
				resolve(Buffer.concat(chunks))
			})

			req.on('error', (error: Error) => {
				reject(error)
			})
		})
	}

	protected async readJsonBody<T extends Json>(req: IncomingMessage, type: Type<T>): Promise<T> {
		const rawBody = await this.readRawBody(req)
		const textBody = rawBody.toString('utf8')
		const jsonBody = JSON.parse(textBody)

		return type(jsonBody)
	}
}
