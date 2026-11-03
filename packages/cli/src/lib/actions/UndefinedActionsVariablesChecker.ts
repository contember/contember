import { Output } from '@contember/cli-common'
import { Actions } from '@contember/schema'
import { getWebhookTargetVariableNames } from '@contember/schema-utils'
import { RemoteProject } from '../project/RemoteProject.js'
import { ActionsApi, ActionsClient } from './ActionsClient.js'

export type ActionsVariablesClientFactory = (project: RemoteProject) => Pick<ActionsApi, 'listVariables'>

const createActionsClient: ActionsVariablesClientFactory = project => ActionsClient.create(project.endpoint, project.name, project.token)

/**
 * Warns, never fails, about webhook targets that interpolate a variable the engine does not define:
 * the engine holds such a target's events back until the variable is set.
 */
export class UndefinedActionsVariablesChecker {
	constructor(
		private readonly output: Output = new Output(),
		private readonly createClient: ActionsVariablesClientFactory = createActionsClient,
	) {
	}

	/** `loadActions` builds the migrated schema's actions; a failure there is reported like a failed lookup. */
	public async check(project: RemoteProject, loadActions: () => Promise<Actions.Schema>): Promise<void> {
		let referencing: { name: string; variables: string[] }[]
		let defined: Set<string>
		try {
			referencing = Object.entries((await loadActions()).targets)
				.map(([name, target]) => ({ name, variables: getWebhookTargetVariableNames(target) }))
				.filter(it => it.variables.length > 0)
			if (referencing.length === 0) {
				return
			}
			const variables = await this.createClient(project).listVariables()
			// the engine treats an empty value as unset; an environment value is not returned at all (null)
			defined = new Set(variables.filter(it => it.value !== '').map(it => it.name))
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error)
			this.output.warn(`Warning: could not check the variables webhook targets reference: ${reason}`)
			return
		}

		for (const { name, variables } of referencing) {
			const undefinedVariables = variables.filter(it => !defined.has(it))
			if (undefinedVariables.length > 0) {
				this.output.warn(
					`Warning: webhook target ${name} references undefined variables: ${undefinedVariables.join(', ')}. `
						+ 'Its events wait until they are set (actions set-variables, or the engine environment).',
				)
			}
		}
	}
}
