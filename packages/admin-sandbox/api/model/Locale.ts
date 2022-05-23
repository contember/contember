import { SchemaDefinition as d } from '@contember/schema-definition'

export class Locale {
	code = d.stringColumn().unique().notNull()
	label = d.stringColumn()
}

export class LocaleDialect {
	locale = d.manyHasOne(Locale)
	label = d.stringColumn()
}
