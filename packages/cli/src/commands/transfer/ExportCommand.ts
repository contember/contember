import { CliError, Command, CommandConfiguration, escapeTerminalText, ExitCode, Input, Output } from '@contember/cli-common'
import { createWriteStream } from 'node:fs'
import { maskToken } from '../../lib/maskToken.js'
import { pipeline } from 'node:stream/promises'
import { createProgressReporter } from '../../lib/transfer/stdio.js'
import { createGzip } from 'node:zlib'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { DataTransferClient, toDataExportStream, toDataTransferStreamError } from '../../lib/transfer/DataTransferClient.js'
import { PassThrough } from 'node:stream'

type Args = {
	source?: string
}
type Options = {
	'include-system'?: boolean
	/** @deprecated */
	'no-gzip'?: boolean
	'no-gzip-output'?: boolean
	'no-gzip-transfer'?: boolean
	output?: string
	'exclude-table'?: string[]
}

export interface ExportResult {
	readonly project: string
	readonly endpoint: string
	readonly file: string
	readonly exported: true
}

export class ExportCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly dataTransferClient: DataTransferClient,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Export data from a project')
		configuration.argument('source').optional()
		configuration.option('include-system').valueNone()
		configuration.option('no-gzip').valueNone().deprecated()
		configuration.option('no-gzip-transfer').valueNone()
		configuration.option('no-gzip-output').valueNone()
		configuration.option('output').valueRequired()
		configuration.option('exclude-table').valueArray()
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void | number> {
		const from = input.getArgument('source')
		const project = await this.remoteProjectResolver.resolve(from)
		if (!project) {
			throw new CliError('Project not defined', { code: 'PROJECT_NOT_DEFINED', exitCode: ExitCode.NotFound })
		}

		output.info('')
		output.info('Exporting data from a following project')
		output.info('')
		output.info(`Project name: ${project.name}`)
		output.info(`API URL: ${project.endpoint}`)
		output.info(`Token: ${maskToken(project.token)}`)

		const gzipOutput = !input.getOption('no-gzip-output') && !input.getOption('no-gzip')
		const gzipTransfer = !input.getOption('no-gzip-transfer')

		const includeSystem = input.getOption('include-system') === true

		const response = await this.dataTransferClient.dataExport({
			project,
			excludeTables: input.getOption('exclude-table') ?? [],
			includeSystem,
			gzip: gzipTransfer,
		})
		let transferred = 0
		let start = Date.now()
		let lastMbReported = 0
		output.info('')
		const printProgress = createProgressReporter(output)
		const stream = toDataExportStream(response)
		const progressStream = new PassThrough()
		progressStream.on('data', chunk => {
			transferred += chunk instanceof Uint8Array ? chunk.byteLength : 0
			const currentMb = Math.floor(transferred / 1024 / 1024)
			if (currentMb > lastMbReported) {
				const durationS = Math.floor((Date.now() - start) / 1000)
				printProgress(`transferred ${currentMb} MiB; ${durationS} seconds`)
				lastMbReported = currentMb
			}
		})

		const fileName = input.getOption('output') ?? `${project.name}.jsonl${gzipOutput ? '.gz' : ''}`
		const fileStream = createWriteStream(fileName)

		try {
			if (gzipOutput) {
				await pipeline(stream, progressStream, createGzip(), fileStream)
			} else {
				await pipeline(stream, progressStream, fileStream)
			}
		} catch (cause) {
			throw toDataTransferStreamError('Export', cause)
		}

		const result: ExportResult = {
			project: project.name,
			endpoint: project.endpoint,
			file: fileName,
			exported: true,
		}
		output.data(result, {
			human: it => ['', 'Export done.', `Data saved to ${escapeTerminalText(it.file)}`].join('\n'),
			quiet: it => it.file,
		})
	}
}
