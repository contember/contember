import { DatabaseContext } from '@contember/engine-system-api'
import { VariablesQuery } from './VariablesQuery'
import { SetVariablesArgs } from '../graphql/schema'
import { DeleteBuilder } from '@contember/database'
import { SetVariableCommand } from './SetVariableCommand'

export type VariablesMap = Record<string, string>

export class VariablesManager {
	public async fetchVariables(db: DatabaseContext): Promise<VariablesMap> {
		return Object.fromEntries((await db.queryHandler.fetch(new VariablesQuery())).map(it => [it.name, it.value]))
	}

	public async setVariables(db: DatabaseContext, args: SetVariablesArgs) {
		return await db.transaction(async db => {
			const current = await this.fetchVariables(db)
			const mode = args.mode ?? 'MERGE'
			const inputVariables = Object.fromEntries(args.variables.map(it => [it.name, it.value]))

			let newVariables: VariablesMap = {}
			switch (mode) {
				case 'APPEND_ONLY_MISSING':
					newVariables = { ...inputVariables, ...current }
					break
				case 'MERGE':
					newVariables = { ...current, ...inputVariables }
					break
				case 'SET':
					newVariables = inputVariables
					break
			}

			const toDelete = Object.keys(current).filter(it => !(it in newVariables))
			if (toDelete.length > 0) {
				await DeleteBuilder.create()
					.from('actions_variable')
					.where(it => it.in('name', toDelete))
					.execute(db.client)
			}

			for (const [name, value] of Object.entries(newVariables)) {
				if (value === current[name]) {
					continue
				}
				await db.commandBus.execute(new SetVariableCommand(name, value))
			}
		})
	}
}
