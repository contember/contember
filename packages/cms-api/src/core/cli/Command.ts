abstract class Command<Args> {

	protected abstract parseArguments(argv: string[]): Args

	protected abstract async execute(args: Args): Promise<void>

	public async run() {
		let args: Args
		try {
			args = this.parseArguments(process.argv)
			await this.execute(args)
		} catch (e) {
			if (e instanceof Command.InvalidArgumentError) {
				console.error(e.message)
				process.exit(1)
			} else {
				console.error(e)
				process.exit(2)
			}
		}
		process.exit(0)
	}
}

namespace Command {
	export class InvalidArgumentError extends Error {
	}
}

export default Command
