import { GraphQlClient as BaseGraphQLClient, GraphQlClientRequestOptions as BaseGraphQlClientRequestOptions } from '@contember/graphql-client'

export interface GraphQlClientRequestOptions extends BaseGraphQlClientRequestOptions {
	/**
	 * @deprecated use apiToken
	 */
	apiTokenOverride?: string
}

export type GraphQlClientFailedRequestMetadata = Pick<Response, 'status' | 'statusText'> & {
	responseText: string
}

export class GraphQlClient extends BaseGraphQLClient {
	/**
	 * @deprecated use execute
	 */
	async sendRequest<T = unknown>(query: string, options: GraphQlClientRequestOptions = {}): Promise<T> {
		// eslint-disable-next-line no-console
		console.debug(query)
		const response = await this.doExecute(query, {
			...options,
			apiToken: options.apiTokenOverride ?? options.apiToken,
		})

		if (response.ok) {
			// It may still have errors (e.g. unfilled fields) but as far as the request goes, it is ok.
			return await response.json()
		}

		const failedRequest: GraphQlClientFailedRequestMetadata = {
			status: response.status,
			statusText: response.statusText,
			responseText: await response.text(),
		}

		return Promise.reject(failedRequest)
	}

}
