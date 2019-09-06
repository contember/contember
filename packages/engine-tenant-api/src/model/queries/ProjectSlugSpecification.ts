import { ConditionBuilder, SelectBuilderSpecification } from '@contember/database'

export const byProjectSlug = (slug: string): SelectBuilderSpecification<'where' | 'with' | 'join'> => qb =>
	qb
		.where((expr: ConditionBuilder) => expr.columnsEq('project_id', ['project', 'id']))
		.with('project', qb =>
			qb
				.from('project')
				.select('id')
				.where({ slug: slug }),
		)
		.join('project', 'project', (cond: ConditionBuilder) => cond.columnsEq(['project', 'id'], 'project_id'))
