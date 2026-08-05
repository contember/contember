import { describe, expect, test } from 'bun:test'
import { gunzipSync, gzipSync } from 'node:zlib'
import { PanelAssetMap, PanelAssetStore, PanelController, PanelRequest } from '../../../src/index.js'

const asset = (contentType: string, content: string) => ({ contentType, gzip: gzipSync(Buffer.from(content, 'utf8')).toString('base64') })

const indexSource = [
	'<!DOCTYPE html>',
	'<base href="__CONTEMBER_PANEL_BASE__">',
	'<script id="contember-panel-config" type="application/json">__CONTEMBER_PANEL_CONFIG__</script>',
	'<script type="module" src="./assets/index-abc123.js"></script>',
].join('\n')

const assets: PanelAssetMap = {
	'index.html': asset('text/html; charset=utf-8', indexSource),
	'assets/index-abc123.js': asset('text/javascript; charset=utf-8', 'console.log(1)'),
	'assets/index-def456.css': asset('text/css; charset=utf-8', 'body{color:red}'),
}

const createController = (basePath = '/panel', pluginApis: () => readonly string[] = () => []) =>
	new PanelController({
		basePath,
		apiBaseUrl: `${basePath}/api`,
		assets: new PanelAssetStore(assets),
		pluginApis,
	})

const get = (path: string | undefined, overrides: Partial<PanelRequest> = {}) =>
	createController().handle({ method: 'GET', path, acceptEncoding: 'gzip, deflate', ...overrides })

const bodyText = (response: { headers: Readonly<Record<string, string>>; body: Buffer }) =>
	(response.headers['Content-Encoding'] === 'gzip' ? gunzipSync(response.body) : response.body).toString('utf8')

describe('panel controller', () => {
	test('serves the app shell at the panel root', () => {
		const response = get(undefined)

		expect(response.status).toBe(200)
		expect(response.headers['Content-Type']).toBe('text/html; charset=utf-8')
		expect(bodyText(response)).toContain('<!DOCTYPE html>')
	})

	test('substitutes the base href and the runtime config', () => {
		const html = bodyText(get(undefined))

		expect(html).toContain('<base href="/panel/">')
		expect(html).toContain('{"basePath":"/panel/","apiBaseUrl":"/panel/api","pluginApis":[]}')
		expect(html).not.toContain('__CONTEMBER_PANEL_')
	})

	test('follows a configured mount path', () => {
		const controller = createController('/admin-console')
		const html = gunzipSync(controller.handle({ method: 'GET', path: undefined, acceptEncoding: 'gzip' }).body).toString('utf8')

		expect(html).toContain('<base href="/admin-console/">')
		expect(html).toContain('"apiBaseUrl":"/admin-console/api"')
	})

	test('serves a built asset with its content type', () => {
		const response = get('assets/index-abc123.js')

		expect(response.headers['Content-Type']).toBe('text/javascript; charset=utf-8')
		expect(bodyText(response)).toBe('console.log(1)')
	})

	test('caches hashed assets immutably and never the shell', () => {
		expect(get('assets/index-def456.css').headers['Cache-Control']).toBe('public, max-age=31536000, immutable')
		expect(get(undefined).headers['Cache-Control']).toBe('no-store')
	})

	test('falls back to the app shell for client-side routes', () => {
		const response = get('p/my-project/members')

		expect(response.status).toBe(200)
		expect(response.headers['Content-Type']).toBe('text/html; charset=utf-8')
	})

	// A traversal cannot reach outside the asset map anyway — there is no filesystem — but it must not
	// resolve to an asset either, and the app shell is the honest answer for an unknown path.
	test('does not resolve traversal or encoded traversal to an asset', () => {
		for (const path of ['../../etc/passwd', '..%2f..%2fetc%2fpasswd', 'assets/../../index.html']) {
			expect(get(path).headers['Content-Type']).toBe('text/html; charset=utf-8')
		}
	})

	test('sends the shell for a request that spells out index.html', () => {
		// Serving the raw asset would leak the unsubstituted placeholders.
		expect(bodyText(get('index.html'))).toContain('<base href="/panel/">')
	})

	test('decompresses when the client does not accept gzip', () => {
		const response = get('assets/index-abc123.js', { acceptEncoding: undefined })

		expect(response.headers['Content-Encoding']).toBeUndefined()
		expect(response.body.toString('utf8')).toBe('console.log(1)')
	})

	test('sets the security headers on the shell only', () => {
		const shell = get(undefined)
		expect(shell.headers['Content-Security-Policy']).toContain(`frame-ancestors 'none'`)
		expect(shell.headers['X-Robots-Tag']).toBe('noindex, nofollow')
		expect(shell.headers['X-Content-Type-Options']).toBe('nosniff')

		expect(get('assets/index-abc123.js').headers['Content-Security-Policy']).toBeUndefined()
	})

	test('rejects anything but GET and HEAD', () => {
		const response = createController().handle({ method: 'POST', path: undefined, acceptEncoding: 'gzip' })

		expect(response.status).toBe(405)
		expect(response.headers['Allow']).toBe('GET, HEAD')
	})

	// The plugins that mount into the panel register after the controller is constructed, so the
	// shell must be rendered from the list as it stands when it is first served.
	test('reports the plugin APIs mounted by the time the shell is served', () => {
		const mounted: string[] = []
		const controller = createController('/panel', () => mounted)
		mounted.push('actions')

		const html = gunzipSync(controller.handle({ method: 'GET', path: undefined, acceptEncoding: 'gzip' }).body).toString('utf8')

		expect(html).toContain('"pluginApis":["actions"]')
	})

	test('refuses to start without a built panel', () => {
		expect(() => new PanelController({ basePath: '/panel', apiBaseUrl: '/panel/api', assets: new PanelAssetStore({}), pluginApis: () => [] }))
			.toThrow(/not built into this binary/)
	})
})

describe('panel asset store', () => {
	test('reports an unbuilt panel', () => {
		expect(new PanelAssetStore({}).isEmpty()).toBe(true)
		expect(new PanelAssetStore(assets).isEmpty()).toBe(false)
	})

	test('decodes an asset once', () => {
		const store = new PanelAssetStore(assets)

		expect(store.getGzip('assets/index-abc123.js')).toBe(store.getGzip('assets/index-abc123.js'))
		expect(store.getGzip('missing.js')).toBeUndefined()
	})
})
