import { SchemaDefinition as def } from '@contember/schema-definition'

export class Article {
	title = def.stringColumn()
	locale = def.manyHasOne(Locale)
}


export class Locale {
	code = def.stringColumn()
}
