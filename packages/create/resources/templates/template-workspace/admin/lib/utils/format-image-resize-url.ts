type ImageResizeOptions = {
	width?: number
	height?: number
	blur?: number
	quality?: number
}

export function formatImageResizeUrl(src: string, resizeOptions: ImageResizeOptions, isDev = import.meta.env.DEV) {
	if (isDev) return src

	const url = new URL(src)
	const urlOptions = Object.keys(resizeOptions)
		.map(key => `${key}=${resizeOptions[key as keyof ImageResizeOptions]}`)
		.join(',')

	return `${url.protocol}//${url.hostname}/cdn-cgi/image/${urlOptions}${url.pathname}`
}
