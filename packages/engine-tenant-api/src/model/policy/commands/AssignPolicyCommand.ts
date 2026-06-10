import { Command } from '../../commands/Command.js'
import { ConflictActionType, InsertBuilder } from '@contember/database'
import { validateAssignmentTags } from '../validation.js'

export interface AssignPolicyInput {
	identityId: string
	policyId: string
	tags?: Record<string, unknown>
	grantedBy?: string | null
}

/**
 * Defense-in-depth: the same `validateAssignmentTags` is applied here so direct
 * command instantiation (bypassing `PolicyService.assign`) still cannot smuggle
 * `${...}` template syntax into the tag bag — a tag with template syntax could
 * rewrite the policy's effective surface at evaluation time.
 */
export class AssignPolicyCommand implements Command<void> {
	constructor(private readonly input: AssignPolicyInput) {}

	async execute({ db }: Command.Args): Promise<void> {
		const tags = this.input.tags ?? {}
		validateAssignmentTags(tags)
		await InsertBuilder.create()
			.into('identity_policy')
			.values({
				identity_id: this.input.identityId,
				policy_id: this.input.policyId,
				tags: tags as Record<string, never>,
				granted_by: this.input.grantedBy ?? null,
			})
			.onConflict(ConflictActionType.update, {
				columns: ['identity_id', 'policy_id'],
			}, {
				tags: expr => expr.select(['excluded', 'tags']),
				granted_by: expr => expr.select(['excluded', 'granted_by']),
			})
			.execute(db)
	}
}
