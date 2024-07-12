import { c } from '@contember/schema-definition'

export class PlateEditorContent {
	unique = c.enumColumn(c.createEnum('unique')).unique().notNull().default('unique')
	data = c.jsonColumn().notNull()
}
