import { SchemaDefinition as d, InputValidation as val } from '@contember/schema-definition'
import { One } from './One'

export class TrivialImage {
	@val.required('required TrivialImage - url')
	url = d.stringColumn()
}

export class BasicImage {
	@val.required('required BasicImage - url')
	url = d.stringColumn()

	width = d.intColumn()
	height = d.intColumn()
	size = d.intColumn()
	type = d.stringColumn()
}

export class ComplexImage {
	@val.required('required ComplexImage - url')
	url = d.stringColumn()

	width = d.intColumn()
	height = d.intColumn()
	size = d.intColumn()
	type = d.stringColumn()
	fileName = d.stringColumn()
	base64 = d.stringColumn()

	alt = d.stringColumn()
}

export class BasicVideo {
	@val.required('required BasicVideo - url')
	url = d.stringColumn()

	width = d.intColumn()
	height = d.intColumn()
	size = d.intColumn()
	type = d.stringColumn()
}

export const DiscriminatedAttachmentType = d.createEnum('image', 'basicImage', 'video')
export class DiscriminatedAttachment {
	type = d.enumColumn(DiscriminatedAttachmentType)
	image = d.oneHasOne(ComplexImage)
	basicImage = d.oneHasOne(BasicImage)
	video = d.oneHasOne(BasicVideo)
}

export class ComplexImageList {
	items: d.OneHasManyDefinition = d.oneHasMany(ComplexImageListItem, 'list')
}

export class ComplexImageListItem {
	list = d.manyHasOne(ComplexImageList, 'items').cascadeOnDelete().notNull()
	order = d.intColumn().notNull()
	image = d.oneHasOne(ComplexImage)
}

export class ComplexFileList {
	items: d.OneHasManyDefinition = d.oneHasMany(ComplexFileListItem, 'list')
}

export const ComplexFileListItemType = d.createEnum('image', 'basicImage', 'video')

export class ComplexFileListItem {
	list = d.manyHasOne(ComplexFileList, 'items').cascadeOnDelete().notNull()
	order = d.intColumn().notNull()
	type = d.enumColumn(ComplexFileListItemType).notNull()

	image = d.oneHasOne(ComplexImage)
	basicImage = d.oneHasOne(BasicImage)
	video = d.oneHasOne(BasicVideo)
}

export class Gallery {
	unique = d.enumColumn(One).notNull().unique()
	items = d.oneHasMany(GalleryItem, 'gallery')
}

export const GalleryItemType = d.createEnum('image', 'basicImage', 'video')
export class GalleryItem {
	gallery = d.manyHasOne(Gallery, 'items')
	type = d.enumColumn(GalleryItemType).notNull()
	image = d.oneHasOne(ComplexImage)
	basicImage = d.oneHasOne(BasicImage)
	video = d.oneHasOne(BasicVideo)
}

export class GalleryList {
	items = d.oneHasMany(GalleryListItem, 'list').orderBy('order')
}

export class GalleryListItem {
	list = d.manyHasOne(GalleryList, 'items')
	order = d.intColumn().notNull()
	item = d.manyHasOne(GalleryItem).notNull().cascadeOnDelete()
}
