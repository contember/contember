import { c } from '@contember/schema-definition'

export class RepeaterItem {
	title = c.stringColumn().notNull()
	order = c.intColumn()
}
