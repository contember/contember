import { CliError, Command, CommandConfiguration, escapeTerminalText, ExitCode, Input, Output } from '@contember/cli-common'
import { createReadStream } from 'node:fs'
import { createGunzip } from 'node:zlib'
import { PassThrough, Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { confirmImport } from './utils.js'
import { maskToken } from '../../lib/maskToken.js'
import { createProgressReporter } from '../../lib/transfer/stdio.js'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { DataTransferClient, toDataTransferStreamError } from '../../lib/transfer/DataTransferClient.js'

export interface ImportResult {
	readonly source: string
	readonly target: { readonly project: string; readonly endpoint: string }
	readonly imported: true
}

type Args = {
	file: string
	target?: string
}
type Options = {
	'yes': boolean
	'no-gzip-transfer'?: boolean
	'dry-run'?: boolean
}

type InputStreamFactory = (path: string) => Readable

export class ImportCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly dataTransferClient: DataTransferClient,
		private readonly inputStreamFactory: InputStreamFactory = path => createReadStream(path),
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Import data into a project')
		configuration.argument('file')
		configuration.argument('target').optional()
		configuration.option('no-gzip-transfer').valueNone()
		configuration.option('yes').valueNone()
		configuration.option('dry-run').valueNone().description('Print what would happen without importing any data.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void | number> {
		const target = input.getArgument('target')
		const project = await this.remoteProjectResolver.resolve(target)
		if (!project) {
			throw new CliError('Target project not defined', { code: 'PROJECT_NOT_DEFINED', exitCode: ExitCode.NotFound })
		}
		const file = input.getArgument('file')

		if (input.getOption('dry-run') === true) {
			output.data(
				{
					dryRun: true,
					source: file,
					target: { project: project.name, endpoint: project.endpoint },
					wipesTarget: true,
				},
				{
					human: it =>
						[
							'Would import data into the following project',
							'',
							`Source file: ${escapeTerminalText(it.source)}`,
							`Project name: ${escapeTerminalText(it.target.project)}`,
							`API URL: ${escapeTerminalText(it.target.endpoint)}`,
							`Token: ${escapeTerminalText(maskToken(project.token))}`,
							'',
							'This would completely wipe the target project.',
							'No data was imported.',
						].join('\n'),
					quiet: it => it.target.project,
				},
			)
			return ExitCode.Success
		}

		output.info('')
		output.info('Importing data into a following project')
		output.info('')
		output.info(`Project name: ${project.name}`)
		output.info(`API URL: ${project.endpoint}`)
		output.info(`Token: ${maskToken(project.token)}`)
		output.info('')
		if (!await confirmImport(input, output)) {
			return ExitCode.InputError
		}
		const baseInputStream = this.inputStreamFactory(file)
		const gzipTransfer = !input.getOption('no-gzip-transfer')
		const runImport = (stream: Readable): Promise<void> =>
			this.dataTransferClient.dataImport({
				stream,
				project,
				printProgress: createProgressReporter(output),
				gzip: gzipTransfer,
			})
		if (file.endsWith('.gz')) {
			const decompressedStream = new PassThrough()
			const sourcePipeline = pipeline(baseInputStream, createGunzip(), decompressedStream).catch(cause => {
				throw toDataTransferStreamError('Import', cause)
			})
			const importOperation = runImport(decompressedStream)
			try {
				await Promise.all([sourcePipeline, importOperation])
			} catch (cause) {
				baseInputStream.destroy()
				decompressedStream.destroy()
				await Promise.allSettled([sourcePipeline, importOperation])
				throw cause instanceof CliError ? cause : toDataTransferStreamError('Import', cause)
			}
		} else {
			await runImport(baseInputStream)
		}
		const result: ImportResult = {
			source: file,
			target: { project: project.name, endpoint: project.endpoint },
			imported: true,
		}
		output.data(result, {
			human: () => '\nImport done.',
			quiet: it => it.target.project,
		})
	}
}
