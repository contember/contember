import { Command, CommandConfiguration, Input, Workspace } from '@contember/cli-common'
import { createWriteStream } from 'node:fs'
import { dataExport, resolveProject } from './utils'
import { maskToken } from '../../utils/token'
import { pipeline } from 'node:stream/promises'
import { printProgressLine } from '../../utils/stdio'

type Args = {
	source?: string
}
type Options = {
	'include-system'?: boolean
	'no-gzip'?: boolean
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
		configuration.option('no-gzip').valueNone()
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

		const noGzip = input.getOption('no-gzip') === true
		const includeSystem = input.getOption('include-system') === true

		const response = await dataExport({ project, includeSystem, noGzip })

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

		const fileName = input.getOption('output') ?? `${project.project}.jsonl${noGzip ? '' : '.gz'}`
		const fileStream = createWriteStream(fileName)

		await pipeline(response, fileStream)

		console.log('\nExport done.')
	}
}
