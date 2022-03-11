import { SchemaDefinition as d } from '@contember/schema-definition'
import { BasicImage } from './Files'
import { Link } from './Link'

export class Content {
	blocks = d.oneHasMany(ContentBlock, 'content').orderBy('order')
}

export class ContentBlock {
	content = d.manyHasOne(Content, 'blocks').cascadeOnDelete().notNull()
	order = d.intColumn().notNull()
	json = d.stringColumn().notNull()
	references = d.oneHasMany(ContentReference, 'block')
}

export const ContentReferenceType = d.createEnum(
	'image', // image
	'quote', // primaryText, secondaryText
	'link', // link
)

export class ContentReference {
	block = d.manyHasOne(ContentBlock, 'references').cascadeOnDelete().notNull()
	type = d.enumColumn(ContentReferenceType).notNull()
	primaryText = d.stringColumn()
	secondaryText = d.stringColumn()
	image = d.manyHasOne(BasicImage)
	link = d.manyHasOne(Link)
}
