import type { SugaredFieldProps } from '@contember/binding'
import { SugaredField } from '@contember/binding'
import type { FileDataExtractor } from '../interfaces'

export interface AudioFileDataExtractorProps {
	durationField?: SugaredFieldProps['field']
}

export const getAudioFileDataExtractor: (props: AudioFileDataExtractorProps) => FileDataExtractor<HTMLAudioElement> = ({
	durationField,
}) => ({
	staticRender: () => !!durationField && <SugaredField field={durationField} />,
	extractFileData: ({ objectUrl }) => {
		if (!durationField) {
			return null
		}
		return new Promise((resolve, reject) => {
			const audio = document.createElement('audio')
			audio.addEventListener('canplay', () => {
				resolve(audio)
			})
			audio.addEventListener('error', () => {
				reject()
			})
			audio.src = objectUrl
		})
	},
	destroy: ({ entity }) => {
		!!durationField && entity.getField(durationField).updateValue(null)
	},
	populateFields: ({ entity, extractedData }) => {
		!!durationField && entity.getField(durationField).updateValue(extractedData.duration)
	},
})
