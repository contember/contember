import { SchemaDefinition as d } from '@contember/schema-definition'
import {
	BasicImage,
	ComplexFileList,
	ComplexImage,
	ComplexImageList,
	DiscriminatedAttachment,
	TrivialImage,
} from './Files'
import { One } from './One'

export class UploadShowcase {
	unique = d.enumColumn(One).notNull().unique()

	singleTrivialImage = d.oneHasOne(TrivialImage)
	singleBasicImage = d.oneHasOne(BasicImage)
	singleComplexImage = d.oneHasOne(ComplexImage)

	discriminatedAttachment = d.oneHasOne(DiscriminatedAttachment)

	imageList = d.oneHasOne(ComplexImageList)
	fileList = d.oneHasOne(ComplexFileList)
}
