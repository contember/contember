import { SchemaDefinition as def } from '@contember/schema-definition'

export class Article {
	status = def.enumColumn(def.createEnum('draft', 'review', 'published'))
}
