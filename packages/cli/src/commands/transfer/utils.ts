import { Readable, Stream } from 'node:stream'
import { LineTransform, readStream } from '../../utils/stream'
import https from 'node:https'
import http from 'node:http'
import { Input, Workspace } from '@contember/cli-common'
import { parseDsn } from '../../utils/dsn'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { interactiveResolveApiToken } from '../../utils/tenant'
import prompts from 'prompts'
import { createGzip } from 'node:zlib'

export type ProjectEndpoint = {
	token: string
	project: string
	baseUrl: string
}

export const resolveProject = async ({ projectOrDsn, workspace }: { projectOrDsn?: string; workspace: Workspace }): Promise<ProjectEndpoint> => {
	let endpoint: string | undefined = undefined
	let token: string | undefined = undefined
	let project: string | undefined
	if (projectOrDsn?.includes('://')) {
		({ endpoint, project, token } = parseDsn(projectOrDsn))
	} else if (projectOrDsn !== undefined && projectOrDsn !== '.') {
		project = projectOrDsn
	}
	const instance = await interactiveResolveInstanceEnvironmentFromInput(workspace, endpoint)
	token ??= await interactiveResolveApiToken({ workspace, instance })
	project ??= (await workspace.projects.getSingleProject()).name
	return { project, token, baseUrl: instance.baseUrl }

}

export const dataImport = async ({ printProgress, stream, project: { project, token, baseUrl }, gzip }: { stream: Readable; project: ProjectEndpoint; printProgress: (message: string) => void; gzip: boolean }) => {
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
				return JSON.stringify([data[0], { ...data[1], project }])
			case 'importContentSchemaBegin':
				return JSON.stringify([data[0], { ...data[1], project }])
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

	return await executeRequest({
		url: `${baseUrl}/import`,
		token,
		headers: {
			'Content-type': 'application/x-ndjson',
			...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
		},
		body: gzip ? inputStream.pipe(createGzip()) : inputStream,
	})
}

export const dataExport = async ({ project: { project, token, baseUrl }, gzip, includeSystem }: { project: ProjectEndpoint; includeSystem: boolean; gzip: boolean }) => {
	return await executeRequest({
		url: `${baseUrl}/export`,
		token,
		headers: {
			'Accept-Encoding': gzip ? 'gzip' : 'identity',
			'Content-type': 'application/json',
		},
		body: JSON.stringify({
			projects: [{ slug: project, system: includeSystem }],
		}),
	})
}

const executeRequest = async ({ url, token, headers, body }: { url: string; token: string; headers: Record<string, string >; body: any }) => {
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

export const confirmImport = async (input: Input<{}, { yes: boolean }>): Promise<boolean> => {
	if (input.getOption('yes')) {
		return true
	}
	if (!process.stdin.isTTY) {
		throw 'TTY not available. Pass --yes option to confirm execution.'
	}
	console.log('This will completely wipe the target project.')
	console.log('(to skip this dialog, you can pass --yes option)')
	console.log('')
	const { ok } = await prompts({
		type: 'confirm',
		name: 'ok',
		message: `Do you want to continue?`,
	})
	return ok
}
