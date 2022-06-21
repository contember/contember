import type { SugaredFieldProps } from '@contember/binding'
import { SugaredField } from '@contember/binding'
import { FileDataExtractor } from './FileDataExtractor'

export interface VideoFileDataExtractorProps {
	widthField?: SugaredFieldProps['field']
	heightField?: SugaredFieldProps['field']
	durationField?: SugaredFieldProps['field']
}

export const getVideoFileDataExtractor: (props: VideoFileDataExtractorProps) => FileDataExtractor<HTMLVideoElement> = ({
	heightField,
	widthField,
	durationField,
}) => ({
	staticRender: () => (
		<>
			{!!widthField && <SugaredField field={widthField} />}
			{!!heightField && <SugaredField field={heightField} />}
			{!!durationField && <SugaredField field={durationField} />}
		</>
	),
	extractFileData: ({ objectUrl }) => {
		if (!durationField && !heightField && !widthField) {
			return null
		}
		return new Promise((resolve, reject) => {
			const video = document.createElement('video')
			video.addEventListener('canplay', () => {
				resolve(video)
			})
			video.addEventListener('error', () => {
				reject()
			})
			video.src = objectUrl
		})
	},
	populateFields: ({ entity, extractedData }) => {
		entity.batchUpdates(getAccessor => {
			widthField && getAccessor().getField(widthField).updateValue(extractedData.videoWidth)
			heightField && getAccessor().getField(heightField).updateValue(extractedData.videoHeight)
			durationField && getAccessor().getField(durationField).updateValue(extractedData.duration)
		})
	},
})
