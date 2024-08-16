export interface ImageResizeOptions {
	width?: number
	height?: number
	blur?: number
	quality?: number
	fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
	format?: 'auto' | 'avif' | 'webp' | 'jpeg' | 'baseline-jpeg' | 'json'
}

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
