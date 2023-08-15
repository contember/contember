import { Command, CommandConfiguration, Input, Workspace } from '@contember/cli-common'
import { createReadStream } from 'node:fs'
import { createGunzip } from 'node:zlib'
import { confirmImport, dataImport, resolveProject } from './utils'
import { maskToken } from '../../utils/token'
import { printProgressLine } from '../../utils/stdio'
import { readStream } from '../../utils/stream'

type Args = {
	file: string
	target?: string
}
type Options = {
	'yes': boolean
}

export class ImportCommand extends Command<Args, Options> {
	constructor(
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Import data into a project')
		configuration.argument('file')
		const from = configuration.argument('target')
		if (this.workspace.isSingleProjectMode()) {
			from.optional()
		}
		configuration.option('yes').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const from = input.getArgument('target')
		const project = await resolveProject({ projectOrDsn: from, workspace: this.workspace })
		console.log('')
		console.log('Importing data into a following project')
		console.log('')
		console.log(`Project name: ${project.project}`)
		console.log(`API URL: ${project.baseUrl}`)
		console.log(`Token: ${maskToken(project.token)}`)
		console.log('')
		if (!await confirmImport(input)) {
			return 1
		}
		const file = input.getArgument('file')
		const baseInputStream = createReadStream(file)
		const stream = (file.endsWith('.gz') ? baseInputStream.pipe(createGunzip()) : baseInputStream)
		const response = await dataImport({ stream: stream, project, printProgress: printProgressLine })
		console.log('')
		const responseData = JSON.parse((await readStream(response)).toString())
		if (responseData.ok) {
			console.log('Import done.')
		} else {
			console.error('Import failed:')
			console.log(responseData)
		}
	}
}

