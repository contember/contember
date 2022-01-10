import { SchemaDefinition as d, InputValidation as val } from '@contember/schema-definition'
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

	@val.required('required UploadShowcase - discriminatedAttachment')
	discriminatedAttachment = d.oneHasOne(DiscriminatedAttachment)

	imageList = d.oneHasOne(ComplexImageList)
	fileList = d.oneHasOne(ComplexFileList)
}
