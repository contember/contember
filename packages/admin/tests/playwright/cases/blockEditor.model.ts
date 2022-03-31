import { SchemaDefinition as def } from '@contember/schema-definition'

export class Article {
	title = def.stringColumn()
	content = def.oneHasOne(Content).notNull()
}

export class Content {
	blocks = def.oneHasMany(ContentBlock, 'content').orderBy('order')
}

export class ContentBlock {
	content = def.manyHasOne(Content, 'blocks').cascadeOnDelete().notNull()
	json = def.stringColumn().notNull()
	order = def.intColumn().notNull()
}

