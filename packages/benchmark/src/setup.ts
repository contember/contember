import { readFile } from 'fs'
import { promisify } from 'util'
import { join } from 'path'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-line
import { graphqlRequest } from './http.js'

const fileRead = promisify(readFile)

const dataInit = async (contentEndpoint: string, accessToken: string) => {
	const initGql = await fileRead(join(__dirname, '/../../src/init.graphql'), { encoding: 'utf8' })

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
