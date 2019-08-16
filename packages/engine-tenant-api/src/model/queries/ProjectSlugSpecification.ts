import { ConditionBuilder, SelectBuilder, SelectBuilderSpecification } from '@contember/database'

export const byProjectSlug = (slug: string): SelectBuilderSpecification<'where' | 'with' | 'join'> => qb =>
	qb
		.where((expr: ConditionBuilder) =>
			expr.compareColumns('project_id', ConditionBuilder.Operator.eq, ['project', 'id']),
		)
		.with('project', qb =>
			qb
				.from('project')
				.select('id')
				.where({ slug: slug }),
		)
		.join('project', 'project', (cond: ConditionBuilder) =>
			cond.compareColumns(['project', 'id'], ConditionBuilder.Operator.eq, 'project_id'),
		)
