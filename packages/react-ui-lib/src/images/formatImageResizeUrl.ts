export interface ImageResizeOptions {
	/** Target width in pixels */
	width?: number
	/** Target height in pixels */
	height?: number
	/** Gaussian blur radius (0-100) */
	blur?: number
	/** Output quality (1-100) */
	quality?: number
	/** Resize behavior */
	fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
	/** Output format */
	format?: 'auto' | 'avif' | 'webp' | 'jpeg' | 'baseline-jpeg' | 'json'
}

/**
 * Generates an optimized image URL using on-demand image processing.
 *
 * Only processes Contember-hosted images (URLs containing `cntmbr.com`).
 * For external images the original URL is returned unchanged.
 * Defaults to `contain` fit and `auto` format when not specified.
 *
 * ## Example
 * ```ts
 * formatImageResizeUrl('https://cdn.cntmbr.com/image.jpg', { width: 300 })
 * // 'https://cdn.cntmbr.com/cdn-cgi/image/width=300,fit=contain,f=auto/image.jpg'
 * ```
 */
export const formatImageResizeUrl = (src: string, options?: ImageResizeOptions) => {
	const url = new URL(src)

	if (!url.origin.includes('cntmbr.com')) {
		return src
	}

	const { fit, format, ...rest } = options || {}
	const resizeOptions = { ...rest, fit: fit || 'contain', f: format || 'auto' }

	const urlOptions = Object.keys(resizeOptions).map(key => `${key}=${resizeOptions[key as keyof typeof resizeOptions]}`).join(',')

	return `${url.origin}/cdn-cgi/image/${urlOptions}${url.pathname}`
}
