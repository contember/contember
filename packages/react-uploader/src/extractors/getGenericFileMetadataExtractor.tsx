import { Field, SugaredRelativeSingleField } from '@contember/react-binding'
import { FileDataExtractor } from '../types'

export interface GenericFileMetadataExtractorProps {
	fileNameField?: SugaredRelativeSingleField['field']
	lastModifiedField?: SugaredRelativeSingleField['field']
	fileSizeField?: SugaredRelativeSingleField['field']
	fileTypeField?: SugaredRelativeSingleField['field']
}

export const getGenericFileMetadataExtractor: (
	props: GenericFileMetadataExtractorProps,
) => FileDataExtractor = ({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }) => ({
	staticRender: () => (
		<>
			{!!fileNameField && <Field field={fileNameField} />}
			{!!fileSizeField && <Field field={fileSizeField} />}
			{!!fileTypeField && <Field field={fileTypeField} />}
			{!!lastModifiedField && <Field field={lastModifiedField} />}
		</>
	),
	extractFileData: ({ file }) => {
		return ({ entity }) => {
			fileNameField && entity.getField(fileNameField).updateValue(file.name)
			fileSizeField && entity.getField(fileSizeField).updateValue(file.size)
			fileTypeField && entity.getField(fileTypeField).updateValue(file.type)
			const lastModifiedFieldAccessor = lastModifiedField ? entity.getField(lastModifiedField) : undefined
			if (lastModifiedFieldAccessor) {
				if (['Date', 'DateTime', 'String'].includes(lastModifiedFieldAccessor.schema.type)) {
					lastModifiedFieldAccessor.updateValue(new Date(file.lastModified).toISOString())
				} else {
					lastModifiedFieldAccessor.updateValue(file.lastModified)
				}
			}
		}
	},
})
