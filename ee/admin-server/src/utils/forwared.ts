import { IncomingMessage } from 'http'
import { parse } from 'ipaddr.js'
import { TLSSocket } from 'tls'

export const isProxyRequest = (req: IncomingMessage): boolean => {
	return parse(req.socket.remoteAddress ?? '0.0.0.0').range() === 'private'
}

export const isRequestSecure = (req: IncomingMessage): boolean => {
	return isProxyRequest(req)
		? req.headers['x-forwarded-proto'] === 'https'
		: (req.socket instanceof TLSSocket && req.socket.encrypted)
}
