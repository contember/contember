import { Field, SugaredRelativeSingleField } from '@contember/react-binding'
import { FileDataExtractor } from '../types'

export interface AudioFileDataExtractorProps {
	durationField?: SugaredRelativeSingleField['field']
}

export const getAudioFileDataExtractor: (props: AudioFileDataExtractorProps) => FileDataExtractor = ({
	durationField,
}) => {
	return ({
		staticRender: () => !!durationField && <Field field={durationField} />,
		extractFileData: async ({ previewUrl }) => {
			if (!durationField) {
				return undefined
			}
			const result = await new Promise<{ duration: number }>((resolve, reject) => {
				const audio = document.createElement('audio')
				audio.addEventListener('canplay', () => {
					const duration = audio.duration
					resolve({ duration })
				})
				audio.addEventListener('error', () => {
					reject()
				})
				audio.src = previewUrl
			})
			return ({ entity }) => {
				let duration = result.duration
				if (entity.getField(durationField).schema.type === 'Integer') {
					duration = Math.round(duration)
				}
				entity.getField(durationField).updateValue(duration)
			}
		},
	})
}
