import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { createWriteStream } from 'node:fs'
import { maskToken } from '../../lib/maskToken'
import { pipeline } from 'node:stream/promises'
import { printProgressLine } from '../../lib/transfer/stdio'
import { createGunzip, createGzip } from 'node:zlib'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver'
import { DataTransferClient } from '../../lib/transfer/DataTransferClient'

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

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const from = input.getArgument('source')
		const project = await this.remoteProjectResolver.resolve(from)
		if (!project) {
			throw `Project not defined`
		}

		console.log('')
		console.log('Exporting data from a following project')
		console.log('')
		console.log(`Project name: ${project.name}`)
		console.log(`API URL: ${project.endpoint}`)
		console.log(`Token: ${maskToken(project.token)}`)

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
		console.log('')
		response.on('data', chunk => {
			transferred += chunk.length
			const currentMb = Math.floor(transferred / 1024 / 1024)
			if (currentMb > lastMbReported) {
				const durationS = Math.floor((Date.now() - start) / 1000)
				printProgressLine(`transferred ${currentMb} MiB; ${durationS} seconds`)
				lastMbReported = currentMb
			}
		})

		const fileName = input.getOption('output') ?? `${project.name}.jsonl${gzipOutput ? '.gz' : ''}`
		const fileStream = createWriteStream(fileName)

		const responseStream = gzipOutput === gzipTransfer
			? response
			: response.pipe(gzipOutput ? createGzip() : createGunzip())

		await pipeline(responseStream, fileStream)

		console.log('\nExport done.')
		console.log(`Data saved to ${fileName}`)
	}
}
