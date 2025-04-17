import { IncomingMessage } from 'node:http'
import ipaddr from 'ipaddr.js'


function isPrivate(ip: string): boolean {
	let addr: ipaddr.IPv4 | ipaddr.IPv6
	try {
		addr = ipaddr.parse(ip)
	} catch {
		return false
	}

	const r = addr.range()
	if (r === 'ipv4Mapped') {
		return (addr as ipaddr.IPv6).toIPv4Address().range() === 'private'
	}

	return r === 'private'       // IPv4 RFC1918
		|| r === 'uniqueLocal'   // IPv6 fc00::/7
		|| r === 'linkLocal'    // IPv6 fe80::/10
}


function isInCIDR(ip: string, cidrs: string[]): boolean {
	if (!cidrs || cidrs.length === 0) {
		return false
	}

	let addr: ipaddr.IPv4 | ipaddr.IPv6
	try {
		addr = ipaddr.parse(ip)
	} catch {
		return false
	}
	return cidrs.some(c => {
		try {
			return addr.match(ipaddr.parseCIDR(c))
		} catch {
			return false
		}
	})
}

export function getClientIP(req: IncomingMessage, trustedProxies?: string[]): string {
	const remote = req.socket.remoteAddress || ''

	if (!isPrivate(remote) && !isInCIDR(remote, trustedProxies || [])) {
		return remote
	}

	const xffHeader = req.headers['x-forwarded-for']
	let xffList: string[] = []

	if (Array.isArray(xffHeader)) {
		xffHeader.forEach(h =>
			xffList.push(...h.split(',').map(ip => ip.trim()).filter(Boolean)),
		)
	} else if (typeof xffHeader === 'string') {
		xffList = xffHeader.split(',').map(ip => ip.trim()).filter(Boolean)
	}

	for (let i = xffList.length - 1; i >= 0; i--) {
		const ip = xffList[i]
		if (!isPrivate(ip) && !isInCIDR(ip, trustedProxies || [])) {
			return ip
		}
	}

	return remote
}
