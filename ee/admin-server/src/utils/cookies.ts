import { IncomingMessage, OutgoingMessage } from 'http'
import * as cookie from 'cookie'
import { isRequestSecure } from './forwared'

const CONTEMBER_TOKEN_COOKIE_NAME = 'CONTEMBER_TOKEN'

export function readAuthCookie(req: IncomingMessage): string | null {
	const cookies = cookie.parse(req.headers.cookie || '')
	return cookies[CONTEMBER_TOKEN_COOKIE_NAME] ?? null
}

export function writeAuthCookie(req: IncomingMessage, res: OutgoingMessage, token: string): void {
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
