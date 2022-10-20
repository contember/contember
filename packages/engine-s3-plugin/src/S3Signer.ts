import { resolveS3Endpoint, S3Config } from './Config'
import { Providers } from '@contember/engine-plugins'
import qs from 'qs'
import { BinaryLike, createHash, createHmac } from 'crypto'

interface S3Request {
	action: 'read' | 'upload'
	key: string
	expiration: number
	headers: Record<string, string>
}

const hmac = (secret: BinaryLike, data: BinaryLike) => createHmac('sha256', secret).update(data).digest()

const hash = (data: BinaryLike) => createHash('sha256').update(data).digest('hex')

const unsignableHeaders = ['authorization', 'content-type', 'content-length', 'user-agent', 'expect', 'x-amzn-trace-id']

const sortMap = <T extends Record<string, any>>(input: T): T => {
	return Object.fromEntries(Object.entries(input).sort((a, b) => (a[0] < b[0] ? -1 : 1))) as T
}
export class S3Signer {
	private region: string

	constructor(private readonly config: S3Config, private readonly providers: Pick<Providers, 'now'>) {
		this.region = config.region || 'eu-west-1'
	}

	public sign(request: S3Request) {
		const uris = resolveS3Endpoint(this.config)
		request.headers.host = uris.endpoint.substring(uris.endpoint.indexOf('://') + 3)
		const nowFormatted = this.providers
			.now()
			.toISOString()
			.replace(/[:\-]|\.\d{3}/g, '')
		const queryString = this.getQueryParams(request, nowFormatted)
		const path = uris.basePath + '/' + request.key
		const lines = [
			request.action === 'read' ? 'GET' : 'PUT',
			path,
			queryString,
			this.getSignedHeaders(request),
			this.getSignedHeaderNames(Object.keys(request.headers)),
			'UNSIGNED-PAYLOAD',
		]
		const canonicalRequest = lines.join('\n')

		const parts = ['AWS4-HMAC-SHA256', nowFormatted, this.getScope(nowFormatted), hash(canonicalRequest)]

		const signature = [nowFormatted.substring(0, 8), this.region, 's3', 'aws4_request', parts.join('\n')]
			.reduce((acc, x) => hmac(acc, x), Buffer.from('AWS4' + this.config.credentials.secret))
			.toString('hex')
		return uris.endpoint + path + '?' + (queryString + '&X-Amz-Signature=' + signature).split('&').sort().join('&')
	}

	private getQueryParams(request: S3Request, dateFormatted: string) {
		const scope = this.getScope(dateFormatted)
		const queryString: Record<string, string> = {
			'X-Amz-Date': dateFormatted,
			'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
			'X-Amz-Credential': this.config.credentials.key + '/' + scope,
			'X-Amz-Expires': String(request.expiration),
			'X-Amz-SignedHeaders': this.getSignedHeaderNames(Object.keys(request.headers)),
		}

		const headersToQs = ['content-type', 'content-md5', 'cache-control']
		for (const header in request.headers) {
			const headerLc = header.toLowerCase()
			if (headersToQs.includes(headerLc) || headerLc.startsWith('x-amz-')) {
				queryString[headerLc.startsWith('x-amz-meta-') ? headerLc : header] = request.headers[header]
			}
		}
		const qsSorted = sortMap(queryString)
		return qs.stringify(qsSorted)
	}

	private getScope(dateFormatted: string) {
		return dateFormatted.substring(0, 8) + '/' + this.region + '/s3/aws4_request'
	}

	private getSignedHeaders(request: S3Request): string {
		const lines = []
		for (const header in request.headers) {
			const headerNameLc = header.toLowerCase()
			if (!this.isHeaderSignable(headerNameLc)) {
				continue
			}
			const value = request.headers[header].replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '')
			lines.push(`${headerNameLc}:${value}\n`)
		}
		return lines.sort().join('')
	}

	private isHeaderSignable(headerName: string) {
		return headerName.toLowerCase().startsWith('x-amz') || !unsignableHeaders.includes(headerName.toLowerCase())
	}

	private getSignedHeaderNames(headers: string[]) {
		return headers
			.map(it => it.toLowerCase())
			.filter(this.isHeaderSignable)
			.sort()
			.join(';')
	}
}
