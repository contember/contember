import Command from './Command'

type CommandFactoryList = { [command: string]: () => Command<any, any> }

export class CommandManager {
	constructor(private readonly commands: CommandFactoryList) {
	}

	public getNames(): string[] {
		return Object.keys(this.commands)
	}

	public createCommand(name: string): Command<any, any> | undefined {
		if (!this.commands[name]) {
			return undefined
		}
		return this.commands[name]()
	}
}
