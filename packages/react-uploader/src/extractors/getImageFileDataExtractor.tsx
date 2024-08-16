import { Field, SugaredFieldProps, SugaredRelativeSingleField } from '@contember/react-binding'
import { SugaredField } from '@contember/react-binding'
import { FileDataExtractor } from '../types'

export interface ImageFileDataExtractorProps {
	widthField?: SugaredRelativeSingleField['field']
	heightField?: SugaredRelativeSingleField['field']
}

export const getImageFileDataExtractor: (props: ImageFileDataExtractorProps) => FileDataExtractor = ({
	heightField,
	widthField,
}) => {
	return ({
		staticRender: () => (
			<>
				{!!widthField && <Field field={widthField} />}
				{!!heightField && <Field field={heightField} />}
			</>
		),
		extractFileData: async ({ previewUrl }) => {
			if (!heightField && !widthField) {
				return undefined
			}
			const result = await new Promise< {
				width: number
				height: number
			}>((resolve, reject) => {
				const image = new Image()
				image.addEventListener('load', () => {
					resolve({
						width: image.naturalWidth,
						height: image.naturalHeight,
					})
				})
				image.addEventListener('error', e => {
					reject(e.message)
				})
				image.src = previewUrl
			})
			return ({ entity }) => {

				widthField && entity.getField(widthField).updateValue(result.width ?? null)
				heightField && entity.getField(heightField).updateValue(result.height ?? null)
			}
		},
	})
}
