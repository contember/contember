import { SchemaDefinition as d } from '@contember/schema-definition'
import { One } from './One'
import { Content } from './Content'

export class Homepage {
	unique = d.enumColumn(One).notNull().unique()
	content = d.oneHasOne(Content)
}
