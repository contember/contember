import { SchemaDefinition as def } from '@contember/schema-definition'
import { Image } from './Image'

export class Post {
	title = def.stringColumn().notNull()
	content = def.stringColumn().notNull()
	image = def.manyHasOne(Image)
}
