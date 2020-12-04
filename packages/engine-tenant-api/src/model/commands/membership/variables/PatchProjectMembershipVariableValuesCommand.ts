import { Command } from '../../Command'
import { ConflictActionType, InsertBuilder, Literal } from '@contember/database'

export class PatchProjectMembershipVariableValuesCommand implements Command<string[]> {
	constructor(
		private readonly membershipId: string,
		private readonly name: string,
		private readonly remove: ReadonlyArray<string>,
		private readonly append: ReadonlyArray<string>,
	) {}

	async execute({ db, providers, bus }: Command.Args): Promise<string[]> {
		const result = await InsertBuilder.create()
			.with('current', qb =>
				qb
					.from('project_membership_variable')
					.where({
						membership_id: this.membershipId,
						variable: this.name,
					})
					.select(expr => expr.raw('jsonb_array_elements_text(value)'), 'value'),
			)
			.with('filtered', qb => qb.from('current').where(expr => expr.not(expr => expr.in('value', [...this.remove]))))
			.with('new_list', qb =>
				qb
					.select(['filtered', 'value'])
					.from('filtered')
					.unionDistinct(qb => qb.select(expr => expr.raw('*')).from(new Literal('unnest(?::text[])', [this.append]))),
			)
			.with('new', qb => qb.from('new_list').select(expr => expr.raw(`jsonb_agg(value)`), 'value'))
			.into('project_membership_variable')
			.from(qb => qb.from('new'))
			.values({
				id: providers.uuid(),
				membership_id: this.membershipId,
				variable: this.name,
				value: expr => expr.select(['new', 'value']),
			})
			.onConflict(ConflictActionType.update, ['membership_id', 'variable'], {
				value: expr => expr.select(['excluded', 'value']),
			})
			.returning('value')
			.execute(db)
		return result.map(it => it.value) as string[]
	}
}
