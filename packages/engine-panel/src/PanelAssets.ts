/**
 * A single file of the built panel UI. Every entry is stored gzip-compressed and base64-encoded so
 * the whole panel can be bundled into `dist/start.js` — the engine docker image contains nothing but
 * that one file, so there is no directory to serve from.
 */
export interface PanelAsset {
	readonly contentType: string
	/** gzip-compressed content, base64-encoded. */
	readonly gzip: string
}

/** Keys are paths relative to the panel root, without a leading slash (`assets/index-a1b2.js`). */
export type PanelAssetMap = Readonly<Record<string, PanelAsset>>

export const indexAssetPath = 'index.html'

export class PanelAssetStore {
	private readonly decoded = new Map<string, Buffer>()

	constructor(private readonly assets: PanelAssetMap) {}

	/** True when the panel was not built into this binary — see `scripts/buildAssets.ts`. */
	public isEmpty(): boolean {
		return this.assets[indexAssetPath] === undefined
	}

	public getContentType(path: string): string | undefined {
		return this.assets[path]?.contentType
	}

	/** Gzipped bytes, decoded from base64 on first use and kept for the process lifetime. */
	public getGzip(path: string): Buffer | undefined {
		const asset = this.assets[path]
		if (!asset) {
			return undefined
		}
		let decoded = this.decoded.get(path)
		if (!decoded) {
			decoded = Buffer.from(asset.gzip, 'base64')
			this.decoded.set(path, decoded)
		}
		return decoded
	}
}
