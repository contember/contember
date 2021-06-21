import { HasOne } from '@contember/binding'
import type { FileDataExtractor } from '../interfaces'

export interface DestroyDataExtractorProps {
	deleteOnRemoveField?: string
}

export const getDestroyDataExtractor: (props: DestroyDataExtractorProps) => FileDataExtractor = ({
	deleteOnRemoveField,
}) => ({
	staticRender: () => !!deleteOnRemoveField && <HasOne field={deleteOnRemoveField} />,
	destroy: ({ entity }) => {
		deleteOnRemoveField && entity.getEntity(deleteOnRemoveField).deleteEntity()
	},
	populateFields: () => {},
})
