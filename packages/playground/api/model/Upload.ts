import { c } from '@contember/schema-definition'

export const UploadOne = c.createEnum('unique')

export class UploadRoot {
	unique = c.enumColumn(UploadOne).notNull().unique()

	image = c.oneHasOne(UploadImage)
	audio = c.oneHasOne(UploadAudio)
	video = c.oneHasOne(UploadVideo)
	file = c.oneHasOne(UploadFile)

	imageTrivial = c.oneHasOne(UploadImage)

	imageList = c.oneHasOne(UploadImageList)
	medium = c.oneHasOne(UploadMedium)
	gallery = c.oneHasOne(UploadGallery)
	list = c.oneHasOne(UploadList)
}

// === file meta ===

export class UploadFileMetadata {
	fileName = c.stringColumn()
	lastModified = c.dateTimeColumn()
	fileSize = c.intColumn()
	fileType = c.stringColumn()
}
// === base file entities for each type ===

export class UploadImage {
	url = c.stringColumn()

	width = c.intColumn()
	height = c.intColumn()
	alt = c.stringColumn()
	meta = c.oneHasOne(UploadFileMetadata)
}

export class UploadVideo {
	url = c.stringColumn()

	width = c.intColumn()
	height = c.intColumn()
	duration = c.intColumn()
	meta = c.oneHasOne(UploadFileMetadata)
}

export class UploadAudio {
	url = c.stringColumn()

	duration = c.intColumn()
	meta = c.oneHasOne(UploadFileMetadata)
}
export class UploadFile {
	url = c.stringColumn()

	meta = c.oneHasOne(UploadFileMetadata)
}

// === list of images ===

export class UploadImageList {
	items = c.oneHasMany(UploadImageListItem, 'list').orderBy('order')
}

export class UploadImageListItem {
	list = c.manyHasOne(UploadImageList, 'items').cascadeOnDelete().notNull()
	order = c.intColumn().notNull()
	image = c.oneHasOne(UploadImage).notNull()
}

// === medium ===


export const UploadMediaType = c.createEnum('image', 'video', 'audio', 'file')

export class UploadMedium {
	type = c.enumColumn(UploadMediaType).notNull()
	image = c.oneHasOne(UploadImage)
	video = c.oneHasOne(UploadVideo)
	audio = c.oneHasOne(UploadAudio)
	file = c.oneHasOne(UploadFile)
}

// === discriminated list of media ===

export class UploadList {
	items = c.oneHasMany(UploadListItem, 'list').orderBy('order')

}
export class UploadListItem {
	list = c.manyHasOne(UploadList, 'items').cascadeOnDelete().notNull()
	order = c.intColumn().notNull()
	item = c.manyHasOne(UploadMedium).notNull().cascadeOnDelete()
}

// === gallery ===
// the files are referenced directly from gallery item

export class UploadGallery {
	items = c.oneHasMany(UploadGalleryItem, 'gallery')
}

export class UploadGalleryItem {
	gallery = c.manyHasOne(UploadGallery, 'items')
	type = c.enumColumn(UploadMediaType).notNull()
	image = c.oneHasOne(UploadImage)
	video = c.oneHasOne(UploadVideo)
	audio = c.oneHasOne(UploadAudio)
	file = c.oneHasOne(UploadFile)
}
