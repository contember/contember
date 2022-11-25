import { URL } from 'url'

export const parseDsn = (dsn: string):  {endpoint: string; project: string; token: string} => {
	const uri = new URL(dsn)
	if (uri.protocol !== 'contember:' && uri.protocol !== 'contember-unsecure:') {
		throw 'Invalid DSN'
	}
	return {
		project: uri.username,
		token: uri.password,
		endpoint: (uri.protocol === 'contember-unsecure:' ? 'http://' : 'https://') + uri.host,
	}
}
