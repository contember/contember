import { DatabaseContext } from '@contember/engine-system-api'
import { VariablesQuery } from './VariablesQuery.js'
import { SetVariablesArgs, Variable } from '../graphql/schema/index.js'
import { DeleteBuilder } from '@contember/database'
import { SetVariableCommand } from './SetVariableCommand.js'
import { Env, projectNameToEnvName } from '@contember/engine-http'
import { UserInputError } from '@contember/graphql-utils'

export type VariablesMap = Record<string, string>

/** Between the project (or DEFAULT) prefix and the variable name: `MY_PROJECT_ACTIONS_VARIABLE_API_KEY`. */
const ENV_NAME_INFIX = '_ACTIONS_VARIABLE_'

export class VariablesManager {
	constructor(
		private readonly env: Env,
	) {
	}

	/** Values for dispatch. A variable supplied by the environment shadows a stored row of the same name. */
	public async fetchVariables(db: DatabaseContext, projectSlug: string): Promise<VariablesMap> {
		return { ...await this.fetchStoredVariables(db), ...this.fetchEnvVariables(projectSlug) }
	}

	public async listVariables(db: DatabaseContext, projectSlug: string): Promise<Variable[]> {
		const envVariables = this.fetchEnvVariables(projectSlug)
		const stored = await this.fetchStoredVariables(db)
		return [
			...Object.entries(stored)
				.filter(([name]) => !(name in envVariables))
				.map(([name, value]): Variable => ({ name, value, source: 'DATABASE' })),
			...Object.entries(envVariables).map(([name, value]): Variable => ({ name, value, source: 'ENVIRONMENT' })),
		]
	}

	public async setVariables(db: DatabaseContext, args: SetVariablesArgs, projectSlug: string) {
		const envVariables = this.fetchEnvVariables(projectSlug)
		const readOnly = args.variables.map(it => it.name).filter(it => it in envVariables)
		if (readOnly.length > 0) {
			throw new UserInputError(`Variables supplied by the environment are read-only: ${readOnly.join(', ')}`)
		}

		return await db.transaction(async db => {
			const current = await this.fetchStoredVariables(db)
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

	private async fetchStoredVariables(db: DatabaseContext): Promise<VariablesMap> {
		return Object.fromEntries((await db.queryHandler.fetch(new VariablesQuery())).map(it => [it.name, it.value]))
	}

	private fetchEnvVariables(projectSlug: string): VariablesMap {
		// the project prefix is read last, so it overrides the shared DEFAULT_ one
		const prefixes = [`DEFAULT${ENV_NAME_INFIX}`, projectNameToEnvName(projectSlug) + ENV_NAME_INFIX]
		const result: VariablesMap = {}
		for (const prefix of prefixes) {
			for (const [name, value] of Object.entries(this.env)) {
				// an empty value counts as unset, the same as the `||` fallback of the config parameter resolver
				if (!name.startsWith(prefix) || name.length === prefix.length || value === '') {
					continue
				}
				result[name.slice(prefix.length)] = value
			}
		}
		return result
	}
}
