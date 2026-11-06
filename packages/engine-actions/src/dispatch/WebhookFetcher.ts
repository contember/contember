import { EgressFetch, EgressGuard, EgressRequestInit } from '@contember/engine-common'

export type FetcherResponse = {
	readonly headers: Headers
	readonly ok: boolean
	readonly status: number
	readonly statusText: string
	readonly responseText: string
}

export interface WebhookFetcher {
	fetch(url: string, init: EgressRequestInit): Promise<FetcherResponse>
}

export class WebhookFetcherNative implements WebhookFetcher {
	constructor(private readonly fetchImpl: EgressFetch) {
	}

	async fetch(url: string, init: EgressRequestInit): Promise<FetcherResponse> {
		const response = await this.fetchImpl(url, init)
		return {
			ok: response.ok,
			headers: response.headers,
			status: response.status,
			statusText: response.statusText,
			responseText: await response.text(),
		}
	}
}

/** Webhooks go through the egress guard when the operator enabled it, otherwise through the global `fetch`. */
export const createWebhookFetcher = (egressGuard: EgressGuard | null): WebhookFetcher => new WebhookFetcherNative(egressGuard?.fetch ?? fetch)
