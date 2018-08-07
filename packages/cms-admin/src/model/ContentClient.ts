import { LOCALSTORAGE_AUTH_TOKEN_KEY } from './LoginModel'

type Variables = { [name: string]: any }

export function getApiUrl(projectSlug: string, stageSlug: string): string {
	return `http://localhost:4000/content/${projectSlug}/${stageSlug}`
}

export async function request<T = any>(
	projectSlug: string,
	stageSlug: string,
	query: string,
	variables: Variables = {}
): Promise<T> {
	const response = await fetch(getApiUrl(projectSlug, stageSlug), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${window.localStorage.getItem(LOCALSTORAGE_AUTH_TOKEN_KEY)}`
		},
		body: JSON.stringify({ query, variables })
	})

	if (response.ok) {
		const result = await response.json()
		if (response.ok && !result.errors && result.data) {
			return result.data
		} else {
			throw new GraphqlError()
		}
	} else {
		throw new GraphqlError(`API responded with not-ok status code: ${response.status} (${response.statusText})`)
	}
}

class GraphqlError extends Error {}
