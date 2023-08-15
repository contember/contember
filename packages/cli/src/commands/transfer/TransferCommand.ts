import { Command, CommandConfiguration, Input, Workspace } from '@contember/cli-common'
import { confirmImport, dataExport, dataImport, resolveProject } from './utils'
import { maskToken } from '../../utils/token'
import { printProgressLine } from '../../utils/stdio'
import { readStream } from '../../utils/stream'

type Args = {
	source: string
	target: string
}
type Options = {
	'include-system'?: boolean
	yes: boolean
}

export class TransferCommand extends Command<Args, Options> {
	constructor(
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Transfer data between projects')
		configuration.argument('source')
		const target = configuration.argument('target')
		if (this.workspace.isSingleProjectMode()) {
			target.optional()
		}
		configuration.option('include-system').valueNone()
		configuration.option('yes').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const source = input.getArgument('source')
		const sourceProject = await resolveProject({ projectOrDsn: source, workspace: this.workspace })

		const target = input.getArgument('target')
		const targetProject = await resolveProject({ projectOrDsn: target, workspace: this.workspace })

		console.log('')
		console.log('Transferring data between projects:')
		console.log('')
		console.log(`Source project name: ${sourceProject.project}`)
		console.log(`Source API URL: ${sourceProject.baseUrl}`)
		console.log(`Source token: ${maskToken(sourceProject.token)}`)
		console.log('')
		console.log(`Target project name: ${targetProject.project}`)
		console.log(`Target API URL: ${targetProject.baseUrl}`)
		console.log(`Target token: ${maskToken(targetProject.token)}`)
		console.log('')
		if (!await confirmImport(input)) {
			return 1
		}

		const includeSystem = input.getOption('include-system') === true
		const exportResponse = (await dataExport({ project: sourceProject, includeSystem, noGzip: true }))
		const importResponse = await dataImport({
			stream: exportResponse, project: targetProject, printProgress: printProgressLine,
		})
		console.log('')

		const responseData = JSON.parse((await readStream(importResponse)).toString())
		if (responseData.ok) {
			console.log('Transfer done.')
		} else {
			console.error('Transfer failed:')
			console.log(responseData)
		}
	}
}
