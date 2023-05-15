import { SchemaDefinition as def, AclDefinition as acl } from '@contember/schema-definition'

export class Article {
	title = def.stringColumn()
}
