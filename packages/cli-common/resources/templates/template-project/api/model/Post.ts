import { SchemaDefinition as d } from '@contember/schema-definition'
import { Image } from './Image'

export class Post {
	title = d.stringColumn().notNull()
	content = d.stringColumn().notNull()
	image = d.manyHasOne(Image)
}
