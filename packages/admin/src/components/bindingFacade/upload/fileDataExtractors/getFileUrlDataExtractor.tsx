import type { SugaredFieldProps } from '@contember/binding'
import { SugaredField } from '@contember/binding'
import type { S3FileUploader } from '@contember/client'
import type { FileDataExtractor } from '../interfaces'

export interface FileUrlDataExtractorProps {
	urlField: SugaredFieldProps['field']
}

export const getFileUrlDataExtractor: (
	props: FileUrlDataExtractorProps,
) => FileDataExtractor<unknown, S3FileUploader.SuccessMetadata> = ({ urlField }) => ({
	staticRender: () => <SugaredField field={urlField} />,
	destroy: ({ entity }) => {
		entity.getField(urlField).updateValue(null)
	},
	populateFields: ({ entity, uploadResult }) => {
		if (!uploadResult.fileUrl || typeof uploadResult.fileUrl !== 'string') {
			return
		}
		entity.getField(urlField).updateValue(uploadResult.fileUrl)
	},
})
