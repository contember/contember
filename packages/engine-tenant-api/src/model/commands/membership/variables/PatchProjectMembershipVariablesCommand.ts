import { Command } from '../../Command'
import { SetProjectMembershipVariableValuesCommand } from './SetProjectMembershipVariableValuesCommand'
import { PatchProjectMembershipVariableValuesCommand } from './PatchProjectMembershipVariableValuesCommand'
import { VariableUpdateInput } from '../types'

export class PatchProjectMembershipVariablesCommand implements Command<Record<string, string[]>> {
	constructor(private readonly membershipId: string, private readonly variables: readonly VariableUpdateInput[]) {}

	async execute({ db, providers, bus }: Command.Args): Promise<Record<string, string[]>> {
		const queries = this.variables.map(async update => {
			if ('set' in update) {
				await bus.execute(new SetProjectMembershipVariableValuesCommand(this.membershipId, update.name, update.set))
				return [update.name, update.set]
			}
			const command = new PatchProjectMembershipVariableValuesCommand(
				this.membershipId,
				update.name,
				update.remove,
				update.append,
			)
			const result = await bus.execute(command)
			return [update.name, result]
		})
		const results = await Promise.all(queries)

		return Object.fromEntries(results)
	}
}
