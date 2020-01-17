import { Command } from './Command'

type CommandFactoryList = { [command: string]: () => Command<any, any> }

export class CommandManager {
	constructor(public readonly commands: CommandFactoryList) {}

	public createCommand(name: string): [string, Command<any, any>] {
		if (this.commands[name]) {
			return [name, this.commands[name]()]
		}
		const pattern = new RegExp('^' + name.replace(/:/g, '\\w*\\:'))
		const matchedCommands = Object.keys(this.commands).filter(it => it.match(pattern))
		if (matchedCommands.length === 1) {
			return [matchedCommands[0], this.commands[matchedCommands[0]]()]
		}
		if (matchedCommands.length === 0) {
			throw new Error(`Command ${name} not found.`)
		}
		throw new Error(
			`Command ${name} is ambiguous. Did you mean one of these?\n - ` + matchedCommands.join('\n - ') + '\n',
		)
	}
}
