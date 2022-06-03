import { SchemaDefinition as d } from '@contember/schema-definition'

export const QuizResultState = d.createEnum('pending', 'failed', 'succeed')

/**
 * Discriminated block example
 */
export class QuizResult {
	answer = d.stringColumn().notNull()
	state = d.enumColumn(QuizResultState).notNull()
	failReason = d.stringColumn()
	successRating = d.intColumn()
}
