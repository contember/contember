import { c } from '@contember/schema-definition'

export class BlockList {
	unique = c.enumColumn(c.createEnum('unique')).default('unique').notNull().unique()
	blocks = c.oneHasMany(Block, 'list').orderBy('order')
}

export const BlockType = c.createEnum(
	'text',  // title, content
	'image', // title, image
	'textWithImage', // title, content, image, imagePosition
	'hero', // title, content, color
)

export class Block {
	list = c.manyHasOne(BlockList, 'blocks')
	order = c.intColumn().notNull()
	type = c.enumColumn(BlockType).notNull()
	title = c.stringColumn().notNull()
	content = c.stringColumn()
	image = c.oneHasOne(BlockImage)
	imagePosition = c.enumColumn(c.createEnum('left', 'right'))
	color = c.stringColumn()
}

export class BlockImage {
	url = c.stringColumn()
}
