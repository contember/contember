export interface Dsn {
	readonly protocol: 'http' | 'https'
	readonly publicKey: string
	/** Host with the port, if any. */
	readonly host: string
	/** Path prefix before the project id, without slashes at either end; usually empty. */
	readonly path: string
	readonly projectId: string
}

/** `https://<public key>@<host>[/<path>]/<project id>`; throws on anything else. */
export const parseDsn = (value: string): Dsn => {
	let url: URL
	try {
		url = new URL(value)
	} catch {
		throw new Error('Invalid Sentry DSN: not a URL')
	}
	const protocol = url.protocol.slice(0, -1)
	if (protocol !== 'http' && protocol !== 'https') {
		throw new Error('Invalid Sentry DSN: the protocol must be http or https')
	}
	if (url.username === '') {
		throw new Error('Invalid Sentry DSN: the public key is missing')
	}
	const segments = url.pathname.split('/').filter(it => it !== '')
	const projectId = segments.pop()
	if (projectId === undefined || !/^\d+$/.test(projectId)) {
		throw new Error('Invalid Sentry DSN: the project id must be a number')
	}
	return { protocol, publicKey: decodeURIComponent(url.username), host: url.host, path: segments.join('/'), projectId }
}

export const envelopeEndpoint = (dsn: Dsn): string => {
	const prefix = dsn.path === '' ? '' : `/${dsn.path}`
	return `${dsn.protocol}://${dsn.host}${prefix}/api/${dsn.projectId}/envelope/`
}

export const authHeader = (dsn: Dsn, client: string): string => `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=${client}`
