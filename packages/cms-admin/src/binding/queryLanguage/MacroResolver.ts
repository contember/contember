import { Environment } from '../dao'

export class MacroResolver {
	public resolve(input: string, environment?: Environment): string {
		return environment === undefined ? input : this.resolveVariables(input, environment)
	}

	// TODO this is too naïve but will do for the time being
	private resolveVariables(input: string, environment: Environment): string {
		const nameStore = environment.getAllNames()
		const names = Object.keys(nameStore)
			.sort()
			.reverse()
		let keepFindingVariables = false

		do {
			keepFindingVariables = false

			for (const name of names) {
				const value = nameStore[name]

				if (value) {
					input = input.replace(`\$${name}`, () => {
						keepFindingVariables = true
						return value.toString()
					})
				}
			}
		} while (keepFindingVariables)
		return input
	}
}
