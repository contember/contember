import type { SugaredFieldProps } from '@contember/react-binding'
import { SugaredField } from '@contember/react-binding'
import { FileDataExtractor } from './FileDataExtractor'

export interface ImageFileDataExtractorProps {
	widthField?: SugaredFieldProps['field']
	heightField?: SugaredFieldProps['field']
}

export const getImageFileDataExtractor: (props: ImageFileDataExtractorProps) => FileDataExtractor<HTMLImageElement> = ({
	heightField,
	widthField,
}) => ({
	staticRender: () => (
		<>
			{!!widthField && <SugaredField field={widthField} />}
			{!!heightField && <SugaredField field={heightField} />}
		</>
	),
	extractFileData: ({ objectUrl }) => {
		if (!heightField && !widthField) {
			return null
		}
		return new Promise((resolve, reject) => {
			const image = new Image()
			image.addEventListener('load', () => {
				resolve(image)
			})
			image.addEventListener('error', e => {
				reject(e.message)
			})
			image.src = objectUrl
		})
	},
	populateFields: ({ entity, extractedData }) => {
		entity.batchUpdates(getAccessor => {
			widthField && getAccessor().getField(widthField).updateValue(extractedData.naturalWidth)
			heightField && getAccessor().getField(heightField).updateValue(extractedData.naturalHeight)
		})
	},
})
