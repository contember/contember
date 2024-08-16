import { c } from '@contember/schema-definition'

export class Folder {
	name = c.stringColumn().notNull()
	parent = c.manyHasOne(Folder, 'children')
	children = c.oneHasMany(Folder, 'parent')
}
