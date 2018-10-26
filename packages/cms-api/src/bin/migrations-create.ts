#!/usr/bin/env node
import { zeroPad } from '../utils/zeroPad'
import { writeFile, realpath } from 'fs'
import { promisify } from 'util'
import Command from '../core/cli/Command'

const fsWrite = promisify(writeFile)
const fsRealpath = promisify(realpath)

const now = new Date()
const year = now.getFullYear()
const month = zeroPad(now.getMonth() + 1, 2)
const day = zeroPad(now.getDate(), 2)
const hours = zeroPad(now.getHours(), 2)
const minutes = zeroPad(now.getMinutes(), 2)
const seconds = zeroPad(now.getSeconds(), 2)
const prefix = `${year}-${month}-${day}-${hours}${minutes}${seconds}`

interface Args {
	type: 'project' | 'tenant'
	name: string
}

const command = new class extends Command<Args> {
	protected parseArguments(argv: string[]): Args {
		const type = argv[2]
		const name = argv[3]

		if (!(type === 'project' || type === 'tenant') || typeof name === 'undefined') {
			throw new Command.InvalidArgumentError(`Usage: node ${argv[1]} project|tenant name`)
		}
		return { type, name }
	}

	protected async execute(args: Args): Promise<void> {
		const filename = `${__dirname}/../../../src/migrations/${args.type}/${prefix}-${args.name}.sql`
		await fsWrite(filename, '', { encoding: 'utf8' })
		console.log(await fsRealpath(filename))
	}
}()

command.run()
