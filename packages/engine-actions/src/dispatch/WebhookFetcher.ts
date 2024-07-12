export type FetcherResponse = {
	readonly headers: Headers
	readonly ok: boolean
	readonly status: number
	readonly statusText: string
	readonly responseText: string
}

export interface WebhookFetcher {
	fetch(url: string, init: RequestInit): Promise<FetcherResponse>
}

export class WebhookFetcherNative implements WebhookFetcher {
	async fetch(url: string, init: RequestInit): Promise<FetcherResponse> {
		const response = await fetch(url, init)
		return {
			ok: response.ok,
			headers: response.headers,
			status: response.status,
			statusText: response.statusText,
			responseText: await response.text(),
		}
	}
}
