import { SchemaDefinition as def } from '@contember/schema-definition'

export class Article {
	title = def.stringColumn().notNull()
	lead = def.stringColumn().notNull()
}
