import type { SugaredFieldProps } from '@contember/binding'
import { SugaredField } from '@contember/binding'
import type { FileDataExtractor } from '../interfaces'

export interface GenericFileMetadataExtractorProps {
	fileNameField?: SugaredFieldProps['field']
	lastModifiedField?: SugaredFieldProps['field']
	fileSizeField?: SugaredFieldProps['field']
	fileTypeField?: SugaredFieldProps['field']
}

export const getGenericFileMetadataExtractor: (
	props: GenericFileMetadataExtractorProps,
) => FileDataExtractor<HTMLVideoElement> = ({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }) => ({
	staticRender: () => (
		<>
			{!!fileNameField && <SugaredField field={fileNameField} />}
			{!!fileSizeField && <SugaredField field={fileSizeField} />}
			{!!fileTypeField && <SugaredField field={fileTypeField} />}
			{!!lastModifiedField && <SugaredField field={lastModifiedField} />}
		</>
	),
	destroy: ({ entity }) => {
		entity.batchUpdates(getAccessor => {
			fileNameField && getAccessor().getField(fileNameField).updateValue(null)
			fileSizeField && getAccessor().getField(fileSizeField).updateValue(null)
			fileTypeField && getAccessor().getField(fileTypeField).updateValue(null)
			lastModifiedField && getAccessor().getField(lastModifiedField).updateValue(null)
		})
	},
	populateFields: ({ entity, file }) => {
		entity.batchUpdates(getAccessor => {
			fileNameField && getAccessor().getField(fileNameField).updateValue(file.name)
			fileSizeField && getAccessor().getField(fileSizeField).updateValue(file.size)
			fileTypeField && getAccessor().getField(fileTypeField).updateValue(file.type)
			lastModifiedField && getAccessor().getField(lastModifiedField).updateValue(file.lastModified)
		})
	},
})
