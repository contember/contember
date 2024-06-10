import { c } from '@contember/schema-definition'

export class EditorContent {
	unique = c.enumColumn(c.createEnum('unique')).unique().notNull().default('unique')
	data = c.jsonColumn().notNull()
	references = c.oneHasMany(EditorReference, 'content')
}

export const EditorReferenceType = c.createEnum('image', 'link', 'quote')

export class EditorReference {
	content = c.manyHasOne(EditorContent, 'references').notNull()
	type = c.enumColumn(EditorReferenceType).notNull()
	image = c.manyHasOne(EditorImage)
	link = c.manyHasOne(EditorLink)
}

export class EditorImage {
	url = c.stringColumn().notNull()
}

export class EditorLink {
	url = c.stringColumn().notNull()
}

export class EditorTextArea {
	unique = c.enumColumn(c.createEnum('unique')).default('unique').notNull().unique()
	data = c.stringColumn().notNull()
}
