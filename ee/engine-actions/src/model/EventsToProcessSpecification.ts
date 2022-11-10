import { Operator, SelectBuilderSpecification } from '@contember/database'


export const eventsToProcessStateSpecification: SelectBuilderSpecification = qb => qb
	.where(it => it.in('state', ['retrying', 'created', 'processing']))

export const eventsToProcessSpecification: SelectBuilderSpecification = qb => qb
	.match(eventsToProcessStateSpecification)
	.where(it => it.compare('visible_at', Operator.lte, 'now'))
	.orderBy('priority', 'desc')
	.orderBy('visible_at')
