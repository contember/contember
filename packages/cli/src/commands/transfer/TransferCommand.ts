import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { confirmImport } from './utils'
import { maskToken } from '../../lib/maskToken'
import { printProgressLine } from '../../lib/transfer/stdio'
import { readStream } from '../../lib/stream'
import { createGunzip } from 'node:zlib'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver'
import { DataTransferClient } from '../../lib/transfer/DataTransferClient'

type Args = {
	source: string
	target: string
}
type Options = {
	'include-system'?: boolean
	'no-gzip-transfer'?: boolean
	yes: boolean
}

export class TransferCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly dataTransferClient: DataTransferClient,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Transfer data between projects')
		configuration.argument('source')
		configuration.argument('target').optional()
		configuration.option('include-system').valueNone()
		configuration.option('no-gzip-transfer').valueNone()
		configuration.option('yes').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const source = input.getArgument('source')
		const sourceProject = await this.remoteProjectResolver.resolve(source)
		if (!sourceProject) {
			throw `Source project not defined`
		}

		const target = input.getArgument('target')
		const targetProject = await this.remoteProjectResolver.resolve(target)
		if (!targetProject) {
			throw `Target project not defined`
		}


		console.log('')
		console.log('Transferring data between projects:')
		console.log('')
		console.log(`Source project name: ${sourceProject.name}`)
		console.log(`Source API URL: ${sourceProject.endpoint}`)
		console.log(`Source token: ${maskToken(sourceProject.token)}`)
		console.log('')
		console.log(`Target project name: ${targetProject.name}`)
		console.log(`Target API URL: ${targetProject.endpoint}`)
		console.log(`Target token: ${maskToken(targetProject.token)}`)
		console.log('')
		if (!await confirmImport(input)) {
			return 1
		}

		const includeSystem = input.getOption('include-system') === true
		const gzipTransfer = !input.getOption('no-gzip-transfer')
		const exportResponse = (await this.dataTransferClient.dataExport({
			project: sourceProject,
			includeSystem,
			gzip: gzipTransfer,
		}))
		const ungzipedResponse = gzipTransfer ? exportResponse.pipe(createGunzip()) : exportResponse
		const importResponse = await this.dataTransferClient.dataImport({
			stream: ungzipedResponse,
			project: targetProject,
			printProgress: printProgressLine,
			gzip: gzipTransfer,
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
