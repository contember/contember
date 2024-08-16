import { Field, SugaredRelativeSingleField } from '@contember/react-binding'
import { FileDataExtractor } from '../types'

export interface VideoFileDataExtractorProps {
	widthField?: SugaredRelativeSingleField['field']
	heightField?: SugaredRelativeSingleField['field']
	durationField?: SugaredRelativeSingleField['field']
}

export const getVideoFileDataExtractor: (props: VideoFileDataExtractorProps) => FileDataExtractor = ({
	heightField,
	widthField,
	durationField,
}) => {
	return ({
		staticRender: () => (
			<>
				{!!widthField && <Field field={widthField} />}
				{!!heightField && <Field field={heightField} />}
				{!!durationField && <Field field={durationField} />}
			</>
		),
		extractFileData: async ({ previewUrl }) => {
			if (!durationField && !heightField && !widthField) {
				return undefined
			}
			const result = await  new Promise<{
				videoWidth: number
				videoHeight: number
				duration: number
			}>((resolve, reject) => {
				const video = document.createElement('video')
				video.addEventListener('canplay', () => {
					const duration = video.duration
					const videoWidth = video.videoWidth
					const videoHeight = video.videoHeight

					resolve({ duration, videoWidth, videoHeight })
				})
				video.addEventListener('error', () => {
					reject()
				})
				video.src = previewUrl
			})
			return ({ entity }) => {
				widthField && entity.getField(widthField).updateValue(result.videoWidth ?? null)
				heightField && entity.getField(heightField).updateValue(result.videoHeight ?? null)

				const durationFieldAccessor = durationField ? entity.getField(durationField) : null
				let duration = result.duration
				if (durationFieldAccessor?.schema.type === 'Integer') {
					duration = Math.round(duration)
				}
				durationFieldAccessor?.updateValue(duration)
			}
		},
	})
}
