import { SchemaDefinition as d } from '@contember/schema-definition'
import { BasicImage } from './Files'
import { ContentBlockType } from './InputShowcase'

export class ContentBlockPage {
	unique = d.enumColumn(d.createEnum('One')).unique()
	blocks = d.oneHasMany(BlockRepeaterBlock, 'blockRepeater').orderBy('order')
}

export class BlockRepeaterBlock {
	order = d.intColumn().notNull()
	type = d.enumColumn(ContentBlockType).notNull()

	content = d.stringColumn()
	author = d.stringColumn()
	images = d.oneHasMany(RepeaterGallery, 'repeaterReference').orderBy('order')
	blockRepeater = d.manyHasOne(ContentBlockPage, 'blocks')
}

export class RepeaterGallery {
	order = d.intColumn().notNull()
	image = d.manyHasOne(BasicImage).notNull()
	repeaterReference = d.manyHasOne(BlockRepeaterBlock, 'images').cascadeOnDelete()
}
