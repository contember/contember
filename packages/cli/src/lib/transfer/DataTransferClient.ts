import { CliError, ExitCode } from '@contember/cli-common'
import { LineTransform } from '../stream.js'
import { PassThrough, Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'
import { RemoteProject } from '../project/RemoteProject.js'
import { toHttpTransportError, toTransportError } from '../errors/TransportError.js'

const transferContext = (action: 'Import' | 'Export', endpoint: string) => ({
	service: `Data ${action.toLowerCase()}`,
	codePrefix: `TRANSFER_${action.toUpperCase()}`,
	url: `${endpoint}/${action.toLowerCase()}`,
})

const transferStreamError = (action: 'Import' | 'Export', cause: unknown): CliError =>
	new CliError(`${action} stream failed`, {
		code: `TRANSFER_${action.toUpperCase()}_STREAM_FAILED`,
		exitCode: ExitCode.InputError,
		details: { operation: action.toLowerCase() },
		cause,
	})

type TransferCommandName =
	| 'importSystemSchemaBegin'
	| 'importContentSchemaBegin'
	| 'insertBegin'
	| 'insertRow'
	| 'insertEnd'

const transferCommandNames: ReadonlySet<string> = new Set<TransferCommandName>([
	'importSystemSchemaBegin',
	'importContentSchemaBegin',
	'insertBegin',
	'insertRow',
	'insertEnd',
])

const isTransferCommandName = (value: string): value is TransferCommandName => transferCommandNames.has(value)

interface TransferEvent {
	readonly name: TransferCommandName
	readonly payload?: Record<string, unknown>
}

const parseTransferEvent = (line: string): TransferEvent => {
	const value: unknown = JSON.parse(line)
	if (!Array.isArray(value) || typeof value[0] !== 'string') {
		throw invalidTransferCommand('TRANSFER_IMPORT_INVALID_COMMAND')
	}
	if (!isTransferCommandName(value[0])) {
		throw invalidTransferCommand('TRANSFER_IMPORT_UNKNOWN_COMMAND')
	}
	const payload = value[1]
	return {
		name: value[0],
		...(typeof payload === 'object' && payload !== null && !Array.isArray(payload) ? { payload } : {}),
	}
}

const invalidTransferCommand = (code: 'TRANSFER_IMPORT_INVALID_COMMAND' | 'TRANSFER_IMPORT_UNKNOWN_COMMAND'): CliError =>
	new CliError('Import stream contains an unsupported command', {
		code,
		exitCode: ExitCode.InputError,
		details: { operation: 'import' },
	})

const normalizeImportStreamError = (cause: unknown): CliError => {
	if (
		cause instanceof CliError
		&& (cause.code === 'TRANSFER_IMPORT_INVALID_COMMAND' || cause.code === 'TRANSFER_IMPORT_UNKNOWN_COMMAND')
	) {
		return cause
	}
	return transferStreamError('Import', cause)
}

const requireEventPayload = (event: TransferEvent): Record<string, unknown> => {
	if (event.payload === undefined) {
		throw new Error(`Transfer event ${event.name} has no payload`)
	}
	return event.payload
}

const toBytes = (chunk: unknown): Uint8Array => {
	if (typeof chunk === 'string') {
		return Buffer.from(chunk)
	}
	if (chunk instanceof Uint8Array) {
		return chunk
	}
	throw transferStreamError('Import', new Error('Unsupported stream chunk'))
}

const toUploadStream = (stream: Readable): ReadableStream<Uint8Array> => {
	const iterator: AsyncIterator<unknown> = stream[Symbol.asyncIterator]()
	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			try {
				const next = await iterator.next()
				if (next.done) {
					controller.close()
				} else {
					controller.enqueue(toBytes(next.value))
				}
			} catch (cause) {
				controller.error(transferStreamError('Import', cause))
			}
		},
		async cancel() {
			stream.destroy()
			try {
				await iterator.return?.()
			} catch {
				// Stream cleanup must not replace the primary transfer error.
			}
		},
	})
}

class WebResponseReadable extends Readable {
	private readonly reader: ReadableStreamDefaultReader<Uint8Array>
	private reading = false
	private released = false

	constructor(stream: ReadableStream<Uint8Array>) {
		super()
		this.reader = stream.getReader()
	}

	public override _read(): void {
		if (this.reading || this.destroyed) {
			return
		}
		this.reading = true
		void this.readNext()
	}

	public override _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
		this.cancelReader().then(
			() => callback(error),
			() => callback(error),
		)
	}

	private async readNext(): Promise<void> {
		try {
			const next = await this.reader.read()
			if (this.destroyed) {
				return
			}
			if (next.done) {
				this.releaseReader()
				this.push(null)
				return
			}
			this.reading = false
			if (this.push(next.value)) {
				this._read()
			}
		} catch (cause) {
			this.destroy(cause instanceof Error ? cause : new Error('Export response stream failed'))
		}
	}

	private async cancelReader(): Promise<void> {
		if (this.released) {
			return
		}
		try {
			await this.reader.cancel()
		} catch {
			// Stream cleanup must not replace the primary transfer error.
		} finally {
			this.releaseReader()
		}
	}

	private releaseReader(): void {
		if (!this.released) {
			this.released = true
			this.reader.releaseLock()
		}
	}
}

const cancelResponseBody = async (response: Response): Promise<void> => {
	try {
		await response.body?.cancel()
	} catch {
		// The HTTP classification is the primary error.
	}
}

const assertImportResult = async (response: Response): Promise<void> => {
	let body: unknown
	try {
		body = await response.json()
	} catch (cause) {
		throw new CliError('Import returned an invalid response', {
			code: 'TRANSFER_IMPORT_INVALID_RESPONSE',
			exitCode: ExitCode.InternalError,
			details: { operation: 'import' },
			cause,
		})
	}
	if (typeof body === 'object' && body !== null && 'ok' in body && body.ok === true) {
		return
	}
	throw new CliError('Import failed', {
		code: 'IMPORT_FAILED',
		exitCode: ExitCode.InputError,
		details: { operation: 'import' },
	})
}

export interface DataExportResponse {
	readonly body: ReadableStream<Uint8Array> | Readable | null
}

type ImportRequestOutcome =
	| { readonly type: 'response'; readonly response: Response }
	| { readonly type: 'request-error'; readonly error: CliError }

type ImportPumpOutcome =
	| { readonly type: 'pump-complete' }
	| { readonly type: 'pump-error'; readonly error: CliError }

interface StreamingRequestInit extends RequestInit {
	readonly duplex: 'half'
}

export class DataTransferClient {
	dataImport = async ({ printProgress, stream, project, gzip }: {
		stream: Readable
		project: RemoteProject
		printProgress: (message: string) => void
		gzip: boolean
	}): Promise<void> => {
		let table = ''
		let rowCount = 0
		let rowTotal = 0
		let transferred = 0
		let start = Date.now()
		const transformedStream = new LineTransform(line => {
			transferred += line.length + 1
			if (line === '') {
				return ''
			}
			const event = parseTransferEvent(line)
			switch (event.name) {
				case 'importSystemSchemaBegin':
					return JSON.stringify([event.name, { ...requireEventPayload(event), project: project.name }])
				case 'importContentSchemaBegin':
					return JSON.stringify([event.name, { ...requireEventPayload(event), project: project.name }])
				case 'insertBegin':
					if (typeof event.payload?.table !== 'string') {
						throw new Error('Insert event has no table')
					}
					table = event.payload.table
					rowCount = 0
					break
				case 'insertRow':
					rowCount++
					rowTotal++
					break
				case 'insertEnd':
					break
			}
			if ((rowCount % 1000) === 0 || event.name !== 'insertRow') {
				const mbs = Math.floor(transferred / 1024 / 1024).toString()
				const durationS = Math.floor((Date.now() - start) / 1000)
				printProgress(`transferred ${mbs} MiB; inserted ${rowCount} ${table} rows, ${rowTotal} total; ${durationS} seconds`)
			}
			return line
		})
		const uploadStream = new PassThrough()
		const abortController = new AbortController()
		const rawPump = gzip
			? pipeline(stream, transformedStream, createGzip(), uploadStream)
			: pipeline(stream, transformedStream, uploadStream)
		const context = transferContext('Import', project.endpoint)
		const requestInit: StreamingRequestInit = {
			headers: {
				'Authorization': `Bearer ${project.token}`,
				'Content-type': 'application/x-ndjson',
				...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
			},
			method: 'POST',
			body: toUploadStream(uploadStream),
			duplex: 'half',
			signal: abortController.signal,
		}
		const rawRequest = fetch(`${project.endpoint}/import`, requestInit)
		const pump: Promise<ImportPumpOutcome> = rawPump.then(
			() => ({ type: 'pump-complete' }),
			cause => {
				abortController.abort()
				return { type: 'pump-error', error: normalizeImportStreamError(cause) }
			},
		)
		const request: Promise<ImportRequestOutcome> = rawRequest.then(
			response => ({ type: 'response', response }),
			error => ({ type: 'request-error', error: toTransportError(error, context) }),
		)

		const first = await Promise.race([request, pump])
		if (first.type === 'pump-error') {
			abortController.abort()
			uploadStream.destroy()
			await request
			throw first.error
		}
		if (first.type === 'request-error') {
			abortController.abort()
			uploadStream.destroy()
			await pump
			throw first.error
		}
		const requestResult = first.type === 'response' ? first : await request
		if (requestResult.type === 'request-error') {
			throw requestResult.error
		}
		const response = requestResult.response
		if (!response.ok) {
			abortController.abort()
			uploadStream.destroy()
			await pump
			await cancelResponseBody(response)
			throw toHttpTransportError(
				{ status: response.status, retryAfter: response.headers.get('retry-after') },
				context,
			)
		}
		const pumpResult = await pump
		if (pumpResult.type === 'pump-error') {
			throw pumpResult.error
		}
		await assertImportResult(response)
	}

	dataExport = async ({ project: { name: project, token, endpoint: baseUrl }, gzip, includeSystem, excludeTables }: {
		project: RemoteProject
		excludeTables?: string[]
		includeSystem: boolean
		gzip: boolean
	}): Promise<DataExportResponse> => {
		const context = transferContext('Export', baseUrl)
		let response: Response
		try {
			response = await fetch(`${baseUrl}/export`, {
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
		} catch (error) {
			throw toTransportError(error, context)
		}
		if (!response.ok) {
			await cancelResponseBody(response)
			throw toHttpTransportError(
				{ status: response.status, retryAfter: response.headers.get('retry-after') },
				context,
			)
		}
		return response
	}
}

export const toDataExportStream = (response: DataExportResponse): Readable => {
	if (!response.body) {
		throw new CliError('Export response does not contain a readable stream', {
			code: 'TRANSFER_EXPORT_INVALID_RESPONSE',
			exitCode: ExitCode.InternalError,
			details: { operation: 'export' },
		})
	}
	return response.body instanceof Readable ? response.body : new WebResponseReadable(response.body)
}

export const toDataTransferStreamError = (operation: 'Import' | 'Export', cause: unknown): CliError => transferStreamError(operation, cause)
