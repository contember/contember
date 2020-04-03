import { Command } from './Command'
import chalk from 'chalk'

type CommandFactoryList = { [command: string]: () => Command<any, any> }

export class CommandManager {
	constructor(public readonly commands: CommandFactoryList) {}

	public createCommand(name: string): [string, Command<any, any>] {
		const fullName = this.findCommand(name)
		const factory = this.commands[fullName]
		const originalCommand = Object.entries(this.commands).find(([, it]) => it === factory)!
		if (originalCommand[0] !== fullName) {
			console.warn(chalk.yellow(`Command name "${fullName}" is deprecated, use "${originalCommand[0]}" instead.`))
		}
		return [fullName, factory()]
	}

	private findCommand(name: string): string {
		if (this.commands[name]) {
			return name
		}
		const pattern = new RegExp('^' + name.replace(/:/g, '\\w*\\:'))
		const matchedCommands = Object.keys(this.commands).filter(it => it.match(pattern))
		if (matchedCommands.length === 1) {
			return matchedCommands[0]
		}
		if (matchedCommands.length === 0) {
			throw `Command ${name} not found.`
		}
		throw `Command ${name} is ambiguous. Did you mean one of these?\n - ` + matchedCommands.join('\n - ') + '\n'
	}
}
