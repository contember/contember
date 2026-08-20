export type Arguments = Record<string, string | string[] | undefined>
export type Options = Record<string, string | boolean | string[] | undefined>

export class Input<Args extends Arguments = Arguments, Opts extends Options = Options> {
	constructor(private readonly args: Args, private readonly options: Opts) {}

	getOption<Name extends keyof Opts>(name: Name): Opts[Name] {
		return this.options[name]
	}

	/** Reads an option that is not part of the command signature — the global ones parsed in the same pass. */
	getRawOption(name: string): string | boolean | string[] | undefined {
		const options: Options = this.options
		return options[name]
	}

	getArgument<Name extends keyof Args>(name: Name): Args[Name] {
		return this.args[name]
	}
}
