import { SchemaDefinition as def, AclDefinition as acl } from '@contember/schema-definition'

@def.Unique('title')
export class Article {
	title = def.stringColumn()
}
