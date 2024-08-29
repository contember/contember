import { c } from '@contember/schema-definition'

export const readerRole = c.createRole('reader', { stages: '*' })

export const editorRole = c.createRole('editor', { stages: '*' })

export const categoryEditorVariable = c.createEntityVariable('category', 'Category', editorRole)

@c.Unique('title')
@c.View(`SELECT * FROM article`)
@c.Allow(readerRole, {
	read: true,
})
@c.Allow(editorRole, {
	when: { category: { id: categoryEditorVariable } },
	read: true,
	create: ['title', 'category'],
	update: ['title', 'category'],
})
export class Article {
	title = c.stringColumn()
	deletedAt = c.dateTimeColumn()
	category = c.manyHasOne(Category)
}

@c.View(`
SELECT * FROM article

`)
@c.Allow(readerRole, {
	read: true,
})
@c.Allow(editorRole, {
	read: true,
})
export class Category {
	name = c.stringColumn()
}
