import { SchemaDefinition as d } from '@contember/schema-definition'
import { One } from './One'
import { Content } from './Content'

export class Homepage {
	unique = d.enumColumn(One).notNull().unique()
	title = d.stringColumn()
	lead = d.stringColumn()
	content = d.oneHasOne(Content)
	footer = d.stringColumn()
}
