import { c } from '@contember/schema-definition'

export const ExtendTreeUnique = c.createEnum('unique')

export class ExtendTreeSingle {
	unique = c.enumColumn(ExtendTreeUnique).unique().notNull().default('unique')
	value = c.stringColumn().notNull()
}

export class ExtendTreeMany {
	value = c.stringColumn().notNull()
}
