import { c } from '@contember/schema-definition'

export class HooksValue {
	createdAt = c.dateTimeColumn().notNull().default('now')
	value = c.intColumn().notNull().default(0)
}
