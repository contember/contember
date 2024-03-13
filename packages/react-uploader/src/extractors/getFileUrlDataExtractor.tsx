import { Field, SugaredRelativeSingleField } from '@contember/react-binding'
import { FileDataExtractor } from '../types'

export interface FileUrlDataExtractorProps {
	urlField: SugaredRelativeSingleField['field']
}

export const getFileUrlDataExtractor: (
	props: FileUrlDataExtractorProps,
) => FileDataExtractor = ({ urlField }) => ({
	staticRender: () => <Field field={urlField} />,
	populateFields: ({ entity, result }) => {
		entity.getField(urlField).updateValue(result.publicUrl ?? null)
	},
	getErrorsHolders: ({ entity, environment }) => {
		const urlFieldAccessor = entity.getField(urlField)
		return [urlFieldAccessor, urlFieldAccessor.getParent()]
	},
})
