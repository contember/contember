import * as fs from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { ContemberClientGenerator } from './ContemberClientGenerator'

type Args = {
	['schema-path']?: string
	['out-dir']?: string
}

type Options = {
	['include-deprecated']?: boolean
}

const usageInfo = `
Usage:

From file:
yarn contember-client-generator <schema.json> <out-dir> [--include-deprecated]

From stdin:
yarn run --silent contember project:print-schema --format=schema | yarn contember-client-generator - <out-dir> [--include-deprecated]
`

export class GenerateContentClient extends Command<Args, Options> {

	protected configure(configuration: CommandConfiguration<Args, Options>) {
		configuration.description('Generate content client.')

		configuration.argument('schema-path').optional().description('Path to the json schema file. Tip: Use "-" to read from stdin.')
		configuration.argument('out-dir').optional().description('Output directory for generated files.')

		configuration.option('include-deprecated').valueNone().description('Include deprecated entities and fields')
	}

	protected async execute(input: Input<Args, Options>) {
		const schemaPath = input.getArgument('schema-path')
		const outDir = input.getArgument('out-dir')
		const includeDeprecated = input.getOption('include-deprecated')

		if (!schemaPath || !outDir) {
			// eslint-disable-next-line no-console
			console.info(usageInfo)
			throw 'Missing required arguments <schema.json> and <out-dir>'
		}

		const sourceData = await (async () => {
			if (schemaPath === '-') {
				if (process.stdin.isTTY) {
					throw 'Cannot read from stdin in TTY mode'
				}
				const buffer = []
				for await (const chunk of process.stdin) {
					buffer.push(chunk)
				}
				return Buffer.concat(buffer).toString('utf8')
			}
			return await fs.readFile(resolve(process.cwd(), schemaPath), 'utf8')
		})()

		const source = JSON.parse(sourceData)

		const dir = resolve(process.cwd(), outDir)
		const generator = new ContemberClientGenerator()
		const result = generator.generate(source.model, { includeDeprecated })

		await fs.mkdir(dir, { recursive: true })

		for (const [name, content] of Object.entries(result)) {
			await fs.writeFile(join(dir, name), content, 'utf8')
		}
	}
}
