import { c } from '@contember/schema-definition'

export class LegacyEditorTextArea {
	unique = c.enumColumn(c.createEnum('unique')).default('unique').notNull().unique()
	data = c.stringColumn().notNull()
}


export class LegacyEditorContent {
	unique = c.enumColumn(c.createEnum('unique')).default('unique').notNull().unique()
	blocks = c.oneHasMany(LegacyEditorBlock, 'content').orderBy('order')
}

export class LegacyEditorBlock {
	content = c.manyHasOne(LegacyEditorContent, 'blocks')
	order = c.intColumn().notNull()
	data = c.stringColumn().notNull()
	references = c.oneHasMany(LegacyEditorReference, 'block')
}

export const LegacyEditorReferenceType = c.createEnum(
	'link',
	'quote',
	'image',
	'embed',
)
export class LegacyEditorReference {
	block = c.manyHasOne(LegacyEditorBlock, 'references').notNull().cascadeOnDelete()
	type = c.enumColumn(LegacyEditorReferenceType).notNull()
	target = c.oneHasOne(LegacyEditorLink).removeOrphan().setNullOnDelete()
	embed = c.oneHasOne(LegacyEditorEmbed, 'reference').removeOrphan()
	image = c.manyHasOne(LegacyEditorImage).setNullOnDelete()
}

export const ContentEmbedType = c.createEnum('youtube', 'vimeo')

export class LegacyEditorEmbed {
	type = c.enumColumn(ContentEmbedType).notNull()
	youtubeId = c.stringColumn()
	vimeoId = c.stringColumn()
	reference = c.oneHasOneInverse(LegacyEditorReference, 'embed')
}

export class LegacyEditorLink {
	url = c.stringColumn()
}

export class LegacyEditorImage {
	url = c.stringColumn()
}

