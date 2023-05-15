import { SchemaDefinition as def, AclDefinition as acl } from '@contember/schema-definition'

export const readerRole = acl.createRole('reader', { stages: '*' })

export const editorRole = acl.createRole('editor', { stages: '*' })

export const categoryEditorVariable = acl.createEntityVariable('category', 'Category', editorRole)


@acl.allow(readerRole, {
	read: true,
})
@acl.allow(editorRole, {
	when: { category: { id: categoryEditorVariable } },
	read: true,
	create: ['title', 'category'],
	update: ['title', 'category'],
})
export class Article {
	title = def.stringColumn()
	deletedAt = def.dateTimeColumn()
	category = def.manyHasOne(Category)
}


@acl.allow(readerRole, {
	read: true,
})
@acl.allow(editorRole, {
	read: true,
})
export class Category {
	name = def.stringColumn()
}
