import { gunzipSync, gzipSync } from 'node:zlib'
import type { InternalHttpContext, InternalHttpController } from '@contember/engine-http'
import { indexAssetPath, PanelAssetStore } from './PanelAssets.js'

export interface PanelControllerArgs {
	/** Mount path without a trailing slash, e.g. `/panel`. */
	basePath: string
	/** Prefix the panel prepends to every API path, e.g. `/panel/api`. */
	apiBaseUrl: string
	assets: PanelAssetStore
}

/** Everything the controller reads from a request — see {@link PanelController.handle}. */
export interface PanelRequest {
	method: string
	/** Path relative to the panel root, i.e. the route's wildcard parameter. */
	path: string | undefined
	acceptEncoding: string | undefined
}

export interface PanelResponse {
	status: number
	headers: Readonly<Record<string, string>>
	body: Buffer
}

const basePlaceholder = '__CONTEMBER_PANEL_BASE__'
const configPlaceholder = '__CONTEMBER_PANEL_CONFIG__'

/**
 * `style-src` allows inline styles because the component libraries set `style` attributes; nothing
 * else is relaxed, and no external origin is reachable at all.
 */
const contentSecurityPolicy = [
	`default-src 'self'`,
	`script-src 'self'`,
	`style-src 'self' 'unsafe-inline'`,
	`img-src 'self' data:`,
	`font-src 'self' data:`,
	`connect-src 'self'`,
	`base-uri 'self'`,
	`form-action 'self'`,
	`frame-ancestors 'none'`,
].join('; ')

/**
 * Serves the built panel UI out of the bundled asset map.
 *
 * Registered as an *internal* route: static assets must not authenticate, and going through the
 * regular pipeline would resolve a project group and verify an API key against the database on every
 * file request. The panel's API traffic is a separate, regular route.
 */
export class PanelController {
	private readonly indexHtml: Buffer

	constructor(private readonly args: PanelControllerArgs) {
		this.indexHtml = this.renderIndex()
	}

	public create(): InternalHttpController {
		return (ctx: InternalHttpContext) => {
			const response = this.handle({
				method: ctx.koa.method,
				path: typeof ctx.params.path === 'string' ? ctx.params.path : undefined,
				acceptEncoding: headerValue(ctx.request.headers['accept-encoding']),
			})
			ctx.koa.status = response.status
			for (const [name, value] of Object.entries(response.headers)) {
				ctx.koa.set(name, value)
			}
			ctx.koa.body = response.body
		}
	}

	public handle(request: PanelRequest): PanelResponse {
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			return { status: 405, headers: { 'Allow': 'GET, HEAD' }, body: Buffer.alloc(0) }
		}

		const path = normalizePath(request.path)
		const gzip = path === undefined || path === indexAssetPath ? undefined : this.args.assets.getGzip(path)

		if (path === undefined || gzip === undefined) {
			// Anything that is not a built file is a client-side route — serve the app shell.
			return this.respond(request, this.indexHtml, {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'no-store',
				'Content-Security-Policy': contentSecurityPolicy,
				'X-Robots-Tag': 'noindex, nofollow',
				'Referrer-Policy': 'no-referrer',
			})
		}
		// Every built file name carries a content hash, so it can never change under the same URL.
		return this.respond(request, gzip, {
			'Content-Type': this.args.assets.getContentType(path) ?? 'application/octet-stream',
			'Cache-Control': 'public, max-age=31536000, immutable',
		})
	}

	private respond(request: PanelRequest, gzipped: Buffer, headers: Record<string, string>): PanelResponse {
		const common = {
			...headers,
			'Vary': 'Accept-Encoding',
			'X-Content-Type-Options': 'nosniff',
		}
		if (acceptsGzip(request.acceptEncoding)) {
			return { status: 200, headers: { ...common, 'Content-Encoding': 'gzip' }, body: gzipped }
		}
		return { status: 200, headers: common, body: gunzipSync(gzipped) }
	}

	private renderIndex(): Buffer {
		const source = this.args.assets.getGzip(indexAssetPath)
		if (source === undefined) {
			throw new Error('The panel UI was not built into this binary. Run `bun run pre-build` before building the server.')
		}
		const config = JSON.stringify({
			basePath: `${this.args.basePath}/`,
			apiBaseUrl: this.args.apiBaseUrl,
		})
		const html = gunzipSync(source)
			.toString('utf8')
			// An absolute base href keeps the relative asset URLs resolving from the panel root at any
			// route depth, which is what lets the mount path stay configurable.
			.replaceAll(basePlaceholder, `${this.args.basePath}/`)
			.replaceAll(configPlaceholder, config)
		return gzipSync(html)
	}
}

const headerValue = (header: string | string[] | undefined): string | undefined => Array.isArray(header) ? header.join(',') : header

const acceptsGzip = (acceptEncoding: string | undefined): boolean =>
	acceptEncoding !== undefined && /(^|,)\s*(gzip|\*)\s*(;|,|$)/.test(acceptEncoding)

/**
 * `undefined` for the panel root, `undefined` for anything that tries to escape the asset map;
 * both fall through to the app shell.
 */
const normalizePath = (raw: string | undefined): string | undefined => {
	if (raw === undefined || raw === '') {
		return undefined
	}
	let decoded: string
	try {
		decoded = decodeURIComponent(raw)
	} catch {
		return undefined
	}
	if (decoded.includes('\0') || decoded.split('/').includes('..')) {
		return undefined
	}
	return decoded
}
