import { mkdir, readFile, writeFile } from 'fs'
import { promisify } from 'util'
import { join } from 'path'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-line
import autocannon from 'autocannon'
import { createHttpOptions, graphqlRequest } from './http'

const fileRead = promisify(readFile)
const dirCreate = promisify(mkdir)
const fileWrite = promisify(writeFile)

const readStdin = (): Promise<string> => {
	return new Promise(resolve => {
		let data = ''

		process.stdin.resume()
		process.stdin.setEncoding('utf8')

		process.stdin.on('data', function (chunk) {
			data += chunk
		})

		process.stdin.on('end', function () {
			resolve(data)
		})
	})
}

const sleep = (delay: number) => new Promise(resolve => setTimeout(resolve, delay))
;(async () => {
	const testName = process.argv[3]
	if (testName) {
		await dirCreate(join(__dirname, '/../../results/', testName))
	}

	const variables = {}

	const serverPort = process.env.CONTEMBER_PORT
	const contentEndpoint = `http://localhost:${serverPort}/content/app/prod`
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const accessToken = process.env.CONTEMBER_ROOT_TOKEN!

	const queryGql = await readStdin()

	console.log('Warmup')
	for (let i = 0; i < 100; i++) {
		await Promise.all(
			[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(() =>
				graphqlRequest({
					endpoint: contentEndpoint,
					query: queryGql,
					authorizationToken: accessToken,
					variables,
				}),
			),
		)
	}
	console.log('Warmup done')
	await sleep(1000)

	const run = (connections: number) => {
		console.log('\n\n\nBenchmarking with concurrency ' + connections)
		const instance = autocannon({
			connections,
			duration: 10,
			...createHttpOptions({
				endpoint: contentEndpoint,
				query: queryGql,
				authorizationToken: accessToken,
				variables,
			}),
		})

		autocannon.track(instance, { renderProgressBar: false })
		instance.on('done', async (result: any) => {
			if (testName) {
				const filename = join(
					__dirname,
					'/../../results/',
					testName,
					'test' + String(connections).padStart(2, '0') + '.json',
				)
				await fileWrite(filename, JSON.stringify(result), { encoding: 'utf8' })
			}

			if (connections <= 8) {
				await sleep(1000)
				run(connections * 2)
			}
		})
	}

	run(1)
})().catch(e => {
	console.error(e)
	process.exit(1)
})
