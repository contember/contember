export const formatImageResizeUrl = (url: string, width?: number, height?: number) => {
	return url.replace('cntmbr.com/', 'cntmbr.com/cdn-cgi/image/width=' + (width ?? '') + ',height=' + (height ?? '') + ',fit=contain/')
}
