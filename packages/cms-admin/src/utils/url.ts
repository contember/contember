import RequestState from '../state/request'

export type RecursiveStringObject = { [key: string]: string | RecursiveStringObject | undefined }

function decode(str: string) {
	const component = decodeURIComponent(str.replace(/\+/g, ' '))
	try {
		return JSON.parse(component)
	} catch {
		return component
	}
}

export function parseParams(query: string): RecursiveStringObject {
	if (!query) return {}
	if (query.charAt(0) === '?') {
		query = query.slice(1)
	}
	const pairs = query.split('&')
	const result: any = {}
	for (let i = 0; i < pairs.length; i++) {
		const value = pairs[i]
		const index = value.indexOf('=')
		if (index > -1) {
			result[decode(value.slice(0, index))] = decode(value.slice(index + 1))
		} else if (value.length) {
			result[decode(value)] = ''
		}
	}

	return result
}

export function buildParams(params: RecursiveStringObject): string {
	let result = ''
	for (let key in params) {
		const value = params[key]
		if (value === undefined) {
			continue
		}
		const component = typeof value === 'string' ? value : JSON.stringify(value)
		result += key + '=' + encodeURIComponent(component) + '&'
	}
	if (result === '') {
		return ''
	}

	return '?' + result.substring(0, result.length - 1)
}

export function buildUrlFromRequest(request: RequestState): string {
	return '/' + buildParams(request)
}
