import { SchemaDefinition as def, AclDefinition as acl } from '@contember/schema-definition'

export const articleState = def.createEnum('draft', 'published')

export class Article {
	title = def.stringColumn()
	state = def.enumColumn(articleState).notNull().default('draft')
}
