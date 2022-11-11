import { SchemaDefinition as def } from '@contember/schema-definition'

export class Article {
	title = def.stringColumn()
}
