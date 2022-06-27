import { SchemaDefinition as def } from '@contember/schema-definition'

export class Upload {
	image = def.manyHasOne(Image)
}

export class Image {
	url = def.stringColumn()

	width = def.intColumn()
	height = def.intColumn()
	size = def.intColumn()
	type = def.stringColumn()
}
