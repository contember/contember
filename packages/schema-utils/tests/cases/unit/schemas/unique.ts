import { SchemaDefinition as def } from '@contember/schema-definition'

@def.Unique('title')
export class Article {
	title = def.stringColumn()
}
