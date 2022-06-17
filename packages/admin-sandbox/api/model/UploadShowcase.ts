import { SchemaDefinition as d } from '@contember/schema-definition'
import {
	BasicImage,
	ComplexFileList,
	ComplexImage,
	ComplexImageList,
	DiscriminatedAttachment,
	GalleryItem,
	GalleryList,
	TrivialImage,
} from './Files'
import { One } from './One'

export class UploadShowcase {
	unique = d.enumColumn(One).notNull().unique()

	singleTrivialImage = d.oneHasOne(TrivialImage)
	singleBasicImage = d.oneHasOne(BasicImage)
	singleComplexImage = d.oneHasOne(ComplexImage)
	multipleBasicImageList = d.oneHasMany(UploadShowcaseImage, 'page')

	discriminatedAttachment = d.oneHasOne(DiscriminatedAttachment).removeOrphan()

	imageList = d.oneHasOne(ComplexImageList)
	fileList = d.oneHasOne(ComplexFileList)

	galleryItem = d.manyHasOne(GalleryItem)
	galleryList = d.oneHasOne(GalleryList)
}

export class UploadShowcaseImage {
	page = d.manyHasOne(UploadShowcase, 'multipleBasicImageList')
	image = d.manyHasOne(BasicImage)
	order = d.intColumn()
}
