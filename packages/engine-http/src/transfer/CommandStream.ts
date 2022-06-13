import { Buffer } from 'node:buffer'
import * as Typesafe from '@contember/typesafe'
import { Command } from './Command'
import { ImportError } from './ImportExecutor'

export async function* toBuffer(commands: AsyncIterable<Command>): AsyncIterable<Buffer> {
	const OUTPUT_BUFFER_SIZE = 16 * 1024
	let chunks = []
	let chunksLength = 0

	for await (const command of commands) {
		const chunk = Buffer.from(JSON.stringify(command) + '\n')
		chunks.push(chunk)
		chunksLength += chunk.length

		if (chunksLength >= OUTPUT_BUFFER_SIZE) {
			yield Buffer.concat(chunks)
			chunks = []
			chunksLength = 0
		}
	}

	if (chunksLength > 0) {
		yield Buffer.concat(chunks)
	}
}

export async function* fromBuffer(stream: AsyncIterable<Buffer>): AsyncIterable<Command> {
	yield* readCommands(readLines(stream))
}

async function* readCommands(lines: AsyncIterable<string>) {
	for await (let line of lines) {
		try {
			yield Command(JSON.parse(line))

		} catch (e) {
			if (e instanceof SyntaxError) {
				throw new ImportError(`Line ${line} is not valid JSON`)

			} else if (e instanceof Typesafe.ParseError) {
				throw new ImportError(`Line ${line} is not valid command`)

			} else {
				throw e
			}
		}
	}
}

async function* readLines(stream: AsyncIterable<Buffer>) {
	let chunks = []

	for await (let chunk of stream) {
		while (true) {
			const eolIndex = chunk.indexOf('\n')

			if (eolIndex < 0) {
				chunks.push(chunk)
				break
			}

			chunks.push(chunk.slice(0, eolIndex))
			chunk = chunk.slice(eolIndex + 1)
			yield Buffer.concat(chunks).toString('utf8')
			chunks = []
		}
	}

	if (Buffer.concat(chunks).length > 0) {
		throw new ImportError(`Unexpected stream end`)
	}
}
