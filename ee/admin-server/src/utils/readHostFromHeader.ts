import { IncomingMessage } from 'http'
import { BadRequestError } from '../BadRequestError'

export const readHostFromHeader = (req: IncomingMessage): string => {
	const host = req.headers.host
	if (!host) {
		throw new BadRequestError(400, 'Missing Host header')
	}
	if (host.includes(':')) {
		return host.slice(0, host.indexOf(':'))
	}
	return host
}
