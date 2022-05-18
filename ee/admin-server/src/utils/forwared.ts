import { IncomingMessage } from 'http'
import ipaddr from 'ipaddr.js'
import { TLSSocket } from 'tls'

export const isProxyRequest = (req: IncomingMessage): boolean => {
	const ip = ipaddr.parse(req.socket.remoteAddress ?? '0.0.0.0')

	if (ip instanceof ipaddr.IPv4) {
		return ip.range() === 'private'

	} else if (ip.range() === 'ipv4Mapped') {
		return ip.toIPv4Address().range() === 'private'

	} else {
		return false
	}
}

export const isRequestSecure = (req: IncomingMessage): boolean => {
	return isProxyRequest(req)
		? req.headers['x-forwarded-proto'] === 'https'
		: (req.socket instanceof TLSSocket && req.socket.encrypted)
}
