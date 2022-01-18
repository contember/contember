import { SchemaDefinition as d } from '@contember/schema-definition'
import { Url } from './Url'

export const LinkType = d.createEnum('internal', 'external')

export class Link {
	type = d.enumColumn(LinkType).notNull()
	internalLink = d.manyHasOne(Url).setNullOnDelete()
	externalLink = d.stringColumn()
}
