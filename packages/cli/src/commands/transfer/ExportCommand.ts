import { Command, CommandConfiguration, Input, Workspace } from '@contember/cli-common'
import { createWriteStream } from 'node:fs'
import { dataExport, resolveProject } from './utils'
import { maskToken } from '../../utils/token'
import { pipeline } from 'node:stream/promises'
import { printProgressLine } from '../../utils/stdio'
import { createGunzip, createGzip } from 'node:zlib'

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
}

export class ExportCommand extends Command<Args, Options> {
	constructor(
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Export data from a project')
		const from = configuration.argument('source')
		if (this.workspace.isSingleProjectMode()) {
			from.optional()
		}
		configuration.option('include-system').valueNone()
		configuration.option('no-gzip').valueNone().deprecated()
		configuration.option('no-gzip-transfer').valueNone()
		configuration.option('no-gzip-output').valueNone()
		configuration.option('output').valueRequired()
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const from = input.getArgument('source')
		const project = await resolveProject({ workspace: this.workspace, projectOrDsn: from })

		console.log('')
		console.log('Exporting data from a following project')
		console.log('')
		console.log(`Project name: ${project.project}`)
		console.log(`API URL: ${project.baseUrl}`)
		console.log(`Token: ${maskToken(project.token)}`)

		const gzipOutput = !input.getOption('no-gzip-output') && !input.getOption('no-gzip')
		const gzipTransfer = !input.getOption('no-gzip-transfer')

		const includeSystem = input.getOption('include-system') === true

		const response = await dataExport({
			project,
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

		const fileName = input.getOption('output') ?? `${project.project}.jsonl${gzipOutput ? '.gz' : ''}`
		const fileStream = createWriteStream(fileName)

		const responseStream = gzipOutput === gzipTransfer
			? response
			: response.pipe(gzipOutput ? createGzip() : createGunzip())

		await pipeline(responseStream, fileStream)

		console.log('\nExport done.')
		console.log(`Data saved to ${fileName}`)
	}
}
