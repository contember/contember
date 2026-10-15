import { createServer, request } from 'node:http'
import { gzipSync } from 'node:zlib'
import { readImportCommands } from '../../../src/transfer/ImportApiMiddlewareFactory.js'

// Driven by importClientAbort.test.ts: uploads an import, whole or half of it and then drops the connection,
// and prints how reading the commands ended — COMPLETED, REJECTED, or HANGING when it neither ends nor fails.
const isGzip = process.argv[2] === 'gzip'
const dropsConnection = process.argv[3] === 'abort'
const ndjson = Buffer.from(
	Array.from({ length: 2000 }, (_, i) => JSON.stringify(['insertRow', [i, 'x'.repeat(100)]]) + '\n').join(''),
)
const body = isGzip ? gzipSync(ndjson, { level: 0 }) : ndjson

const finish = (outcome: string) => {
	console.log(outcome)
	process.exit(0)
}

const server = createServer(async req => {
	try {
		for await (const _ of readImportCommands(req, isGzip)) {
		}
		finish('COMPLETED')
	} catch {
		finish('REJECTED')
	}
})

server.listen(0, '127.0.0.1', () => {
	const address = server.address()
	if (address === null || typeof address === 'string') {
		throw new Error('The server does not listen on a TCP port')
	}
	const client = request({ host: '127.0.0.1', port: address.port, method: 'POST', headers: { 'Content-Length': body.length } })
	client.on('error', () => {})
	if (dropsConnection) {
		client.write(body.subarray(0, body.length / 2))
		setTimeout(() => client.destroy(), 100)
	} else {
		client.end(body)
	}
	setTimeout(() => finish('HANGING'), 2000)
})
