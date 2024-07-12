import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { createReadStream } from 'node:fs'
import { createGunzip } from 'node:zlib'
import { confirmImport } from './utils'
import { maskToken } from '../../lib/maskToken'
import { printProgressLine } from '../../lib/transfer/stdio'
import { readStream } from '../../lib/stream'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver'
import { DataTransferClient } from '../../lib/transfer/DataTransferClient'

type Args = {
	file: string
	target?: string
}
type Options = {
	'yes': boolean
	'no-gzip-transfer'?: boolean
}

export class ImportCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly dataTransferClient: DataTransferClient,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Import data into a project')
		configuration.argument('file')
		configuration.argument('target').optional()
		configuration.option('no-gzip-transfer').valueNone()
		configuration.option('yes').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const target = input.getArgument('target')
		const project = await this.remoteProjectResolver.resolve(target)
		if (!project) {
			throw `Target project not defined`
		}
		console.log('')
		console.log('Importing data into a following project')
		console.log('')
		console.log(`Project name: ${project.name}`)
		console.log(`API URL: ${project.endpoint}`)
		console.log(`Token: ${maskToken(project.token)}`)
		console.log('')
		if (!await confirmImport(input)) {
			return 1
		}
		const file = input.getArgument('file')
		const baseInputStream = createReadStream(file)
		const stream = (file.endsWith('.gz') ? baseInputStream.pipe(createGunzip()) : baseInputStream)
		const gzipTransfer = !input.getOption('no-gzip-transfer')
		const response = await this.dataTransferClient.dataImport({
			stream: stream,
			project,
			printProgress: printProgressLine,
			gzip: gzipTransfer,
		})
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

