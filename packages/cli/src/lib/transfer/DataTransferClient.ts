import { LineTransform } from '../stream'
import { Readable } from 'node:stream'
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
		inputStream.on('error', err => {
			throw new Error(`Input stream error: ${err}`)
		})

		const bodyStream = Readable.toWeb((gzip ? inputStream.pipe(createGzip()) : inputStream)) as unknown as BodyInit

		const response = await fetch(`${project.endpoint}/import`, {
			headers: {
				'Authorization': `Bearer ${project.token}`,
				'Content-type': 'application/x-ndjson',
				...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
			},
			method: 'POST',
			body: bodyStream,
			...{ duplex: 'half' },
		})
		if (!response.ok) {
			const responseBody = await response.text()
			throw new Error(`Invalid response: ${response.statusText}\n${responseBody}`)
		}
		return response
	}


	dataExport = async ({ project: { name: project, token, endpoint: baseUrl }, gzip, includeSystem, excludeTables }: {
		project: RemoteProject
		excludeTables?: string[]
		includeSystem: boolean
		gzip: boolean
	}) => {
		const response = await fetch(`${baseUrl}/export`, {
			headers: {
				'Authorization': `Bearer ${token}`,
				'Accept-Encoding': gzip ? 'gzip' : 'identity',
				'Content-type': 'application/json',
			},
			method: 'POST',
			body: JSON.stringify({
				projects: [{ slug: project, system: includeSystem, excludeTables }],
			}),
		})
		if (!response.ok) {
			const responseBody = await response.text()
			throw new Error(`Invalid response: ${response.statusText}\n${responseBody}`)
		}
		return response
	}
}
