import { SchemaDefinition as def } from '@contember/schema-definition'

export class Article {
	title = def.stringColumn()
	category = def.manyHasOne(Category)
}

export class Category {
	name = def.stringColumn()
}

