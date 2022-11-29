import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { graphqlRequest } from './http'

const dataInit = async (contentEndpoint: string, accessToken: string) => {
	const initGql = await readFile(join(__dirname, '/../../src/init.graphql'), { encoding: 'utf8' })

	await graphqlRequest({
		endpoint: contentEndpoint,
		query: initGql,
		authorizationToken: accessToken,
	})
}
;(async () => {
	const contentEndpoint = `${process.env.CONTEMBER_API_URL}/content/benchmark/live`
	await dataInit(contentEndpoint, process.env.CONTEMBER_ROOT_TOKEN as string)
})().catch(e => {
	console.error(e)
	process.exit(1)
})
