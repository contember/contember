interface RequestOpts {
	body?: BodyInit | null
	headers?: Record<string, string>
	method?: string
}

interface Callbacks {
	onUploadProgress?: (e: ProgressEvent) => void
}

interface Response {
	body: string
}

export default function httpFetch(url: string, opts: RequestOpts = {}, callbacks: Callbacks = {}): Promise<Response> {
	return new Promise<Response>((res, rej) => {
		const xhr = new XMLHttpRequest()
		xhr.open(opts.method || 'get', url)
		if (opts.headers) {
			Object.entries(opts.headers).forEach(([name, value]) => xhr.setRequestHeader(name, value))
		}

		xhr.onload = e => {
			res({
				body: xhr.responseText
			})
		}
		xhr.onerror = rej

		if (xhr.upload && callbacks.onUploadProgress) {
			xhr.upload.onprogress = callbacks.onUploadProgress
		}
		xhr.send(opts.body)
	})
}
