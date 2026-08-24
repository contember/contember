import { c } from '@contember/schema-definition'

export const editorRole = c.createRole('editor', { stages: '*' })

export const readerRole = c.createRole('reader', { stages: '*' })

export const categoryEditorVariable = c.createEntityVariable('category', 'Category', editorRole)

@c.Allow(editorRole, {
	when: { category: { id: categoryEditorVariable } },
	read: true,
	create: ['title', 'category'],
	update: ['title', 'category'],
})
@c.Allow(readerRole, {
	read: true,
})
export class Article {
	title = c.stringColumn()
	deletedAt = c.dateTimeColumn()
	category = c.manyHasOne(Category)
}

@c.Allow(editorRole, {
	through: true,
	read: ['fileName'],
	delete: true,
})
export class Attachment {
	fileName = c.stringColumn()
	size = c.intColumn()
	comment = c.manyHasOne(Comment)
}

@c.Allow(editorRole, {
	read: true,
})
@c.Allow(readerRole, {
	read: true,
})
export class Category {
	name = c.stringColumn()
}

@c.Allow(editorRole, {
	when: { article: { category: { id: categoryEditorVariable } } },
	through: true,
	read: true,
	update: ['note'],
})
@c.Allow(editorRole, {
	read: ['content'],
})
export class Comment {
	content = c.stringColumn()
	note = c.stringColumn()
	article = c.manyHasOne(Article)
}
