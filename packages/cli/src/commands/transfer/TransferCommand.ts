import { CliError, Command, CommandConfiguration, escapeTerminalText, ExitCode, Input, Output } from '@contember/cli-common'
import { confirmImport } from './utils.js'
import { maskToken } from '../../lib/maskToken.js'
import { createProgressReporter } from '../../lib/transfer/stdio.js'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { DataTransferClient, toDataExportStream } from '../../lib/transfer/DataTransferClient.js'

type Args = {
	source: string
	target: string
}
type Options = {
	'include-system'?: boolean
	'no-gzip-transfer'?: boolean
	yes: boolean
	'exclude-table'?: string[]
	'dry-run'?: boolean
}

export interface TransferResult {
	readonly source: { readonly project: string; readonly endpoint: string }
	readonly target: { readonly project: string; readonly endpoint: string }
	readonly transferred: true
}

const canonicalEndpoint = (endpoint: string): string => {
	try {
		const url = new URL(endpoint)
		url.username = ''
		url.password = ''
		url.search = ''
		url.hash = ''
		url.pathname = url.pathname.replace(/\/+$/, '')
		return url.toString().replace(/\/$/, '')
	} catch {
		return endpoint.replace(/\/+$/, '')
	}
}

const isSameProject = (
	source: { readonly name: string; readonly endpoint: string },
	target: { readonly name: string; readonly endpoint: string },
): boolean => source.name === target.name && canonicalEndpoint(source.endpoint) === canonicalEndpoint(target.endpoint)

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
		configuration.option('exclude-table').valueArray()
		configuration.option('dry-run').valueNone().description('Print what would happen without transferring any data.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void | number> {
		const source = input.getArgument('source')
		const sourceProject = await this.remoteProjectResolver.resolve(source)
		if (!sourceProject) {
			throw new CliError('Source project not defined', { code: 'PROJECT_NOT_DEFINED', exitCode: ExitCode.NotFound })
		}

		const target = input.getArgument('target')
		const targetProject = await this.remoteProjectResolver.resolve(target)
		if (!targetProject) {
			throw new CliError('Target project not defined', { code: 'PROJECT_NOT_DEFINED', exitCode: ExitCode.NotFound })
		}
		if (isSameProject(sourceProject, targetProject)) {
			throw new CliError('Source and target resolve to the same project', {
				code: 'TRANSFER_SOURCE_EQUALS_TARGET',
				exitCode: ExitCode.InputError,
				details: { project: sourceProject.name },
			})
		}

		if (input.getOption('dry-run') === true) {
			output.data(
				{
					dryRun: true,
					source: { project: sourceProject.name, endpoint: sourceProject.endpoint },
					target: { project: targetProject.name, endpoint: targetProject.endpoint },
					wipesTarget: true,
				},
				{
					human: it =>
						[
							'Would transfer data between projects',
							'',
							`Source project name: ${escapeTerminalText(it.source.project)}`,
							`Source API URL: ${escapeTerminalText(it.source.endpoint)}`,
							`Source token: ${escapeTerminalText(maskToken(sourceProject.token))}`,
							'',
							`Target project name: ${escapeTerminalText(it.target.project)}`,
							`Target API URL: ${escapeTerminalText(it.target.endpoint)}`,
							`Target token: ${escapeTerminalText(maskToken(targetProject.token))}`,
							'',
							'This would completely wipe the target project.',
							'No data was transferred.',
						].join('\n'),
					quiet: it => it.target.project,
				},
			)
			return ExitCode.Success
		}

		output.info('')
		output.info('Transferring data between projects:')
		output.info('')
		output.info(`Source project name: ${sourceProject.name}`)
		output.info(`Source API URL: ${sourceProject.endpoint}`)
		output.info(`Source token: ${maskToken(sourceProject.token)}`)
		output.info('')
		output.info(`Target project name: ${targetProject.name}`)
		output.info(`Target API URL: ${targetProject.endpoint}`)
		output.info(`Target token: ${maskToken(targetProject.token)}`)
		output.info('')
		if (!await confirmImport(input, output)) {
			return ExitCode.InputError
		}

		const includeSystem = input.getOption('include-system') === true
		const gzipTransfer = !input.getOption('no-gzip-transfer')
		const exportResponse = await this.dataTransferClient.dataExport({
			project: sourceProject,
			includeSystem,
			excludeTables: input.getOption('exclude-table') ?? [],
			gzip: gzipTransfer,
		})
		await this.dataTransferClient.dataImport({
			stream: toDataExportStream(exportResponse),
			project: targetProject,
			printProgress: createProgressReporter(output),
			gzip: gzipTransfer,
		})
		const result: TransferResult = {
			source: { project: sourceProject.name, endpoint: sourceProject.endpoint },
			target: { project: targetProject.name, endpoint: targetProject.endpoint },
			transferred: true,
		}
		output.data(result, {
			human: () => '\nTransfer done.',
			quiet: it => it.target.project,
		})
	}
}
