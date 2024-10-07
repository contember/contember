import http from 'node:http'
import https from 'node:https'
import { LineTransform, readStream } from '../stream'
import { Readable, Stream } from 'node:stream'
import { createGzip } from 'node:zlib'
import { RemoteProject } from '../project/RemoteProject'

export class DataTransferClient {

	dataImport = async ({ printProgress, stream, project, gzip }: {
		stream: Readable
		project: RemoteProject
		printProgress: (message: string) => void
		gzip: boolean
	}) => {
		let table = ''
		let rowCount = 0
		let rowTotal = 0
		let transferred = 0
		let start = Date.now()
		const inputStream = stream.pipe(new LineTransform(line => {
			transferred += line.length + 1
			if (line === '') {
				return ''
			}
			const data = JSON.parse(line)
			switch (data[0]) {
				case 'importSystemSchemaBegin':
					return JSON.stringify([data[0], { ...data[1], project: project.name }])
				case 'importContentSchemaBegin':
					return JSON.stringify([data[0], { ...data[1], project: project.name }])
				case 'insertBegin':
					table = data[1].table
					rowCount = 0
					break
				case 'insertRow':
					rowCount++
					rowTotal++
					break
				case 'insertEnd':
					break
			}
			if ((rowCount % 1000) === 0 || data[0] !== 'insertRow') {
				const mbs = Math.floor(transferred / 1024 / 1024).toString()
				const durationS = Math.floor((Date.now() - start) / 1000)
				printProgress(`transferred ${mbs} MiB; inserted ${rowCount} ${table} rows, ${rowTotal} total; ${durationS} seconds`)
			}
			return line
		}))

		return await this.executeRequest({
			url: `${project.endpoint}/import`,
			token: project.token,
			headers: {
				'Content-type': 'application/x-ndjson',
				...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
			},
			body: gzip ? inputStream.pipe(createGzip()) : inputStream,
		})
	}


	dataExport = async ({ project: { name: project, token, endpoint: baseUrl }, gzip, includeSystem, excludeTables }: {
		project: RemoteProject
		excludeTables?: string[]
		includeSystem: boolean
		gzip: boolean
	}) => {
		return await this.executeRequest({
			url: `${baseUrl}/export`,
			token,
			headers: {
				'Accept-Encoding': gzip ? 'gzip' : 'identity',
				'Content-type': 'application/json',
			},
			body: JSON.stringify({
				projects: [{ slug: project, system: includeSystem, excludeTables }],
			}),
		})
	}


	private executeRequest = async ({ url, token, headers, body }: {
		url: string
		token: string
		headers: Record<string, string>
		body: any
	}) => {
		return await new Promise<http.IncomingMessage>((resolve, reject) => {
			const req = (url.startsWith('https://') ? https : http).request(url, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					...headers,
				},
			}, async res => {
				if (res.statusCode !== 200) {
					const responseBody = (await readStream(res)).toString()
					reject(new Error(`Invalid response: ${res.statusMessage}\n${responseBody}`))
				} else {
					resolve(res)
				}
			})

			if (body instanceof Stream) {
				body.pipe(req)
			} else {
				req.write(body)
				req.end()
			}
		})
	}
}
