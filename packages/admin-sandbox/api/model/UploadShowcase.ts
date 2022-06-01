import { InputValidation as val, SchemaDefinition as d } from '@contember/schema-definition'
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

	@val.required('required UploadShowcase - singleTrivialImage')
	singleTrivialImage = d.oneHasOne(TrivialImage)
	@val.required('required UploadShowcase - singleBasicImage')
	singleBasicImage = d.oneHasOne(BasicImage)
	singleComplexImage = d.oneHasOne(ComplexImage)
	multipleBasicImageList = d.oneHasMany(UploadShowcaseImage, 'page')

	@val.required('required UploadShowcase - discriminatedAttachment')
	discriminatedAttachment = d.oneHasOne(DiscriminatedAttachment)

	imageList = d.oneHasOne(ComplexImageList)
	fileList = d.oneHasOne(ComplexFileList)
}

export class UploadShowcaseImage {
	page = d.manyHasOne(UploadShowcase, 'multipleBasicImageList')
	image = d.manyHasOne(BasicImage)
	order = d.intColumn()
}
