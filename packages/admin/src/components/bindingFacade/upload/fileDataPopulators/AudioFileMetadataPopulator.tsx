import { QueryLanguage, SugaredField, SugaredFieldProps } from '@contember/binding'
import { isAudio } from '../utils'
import { FileDataPopulator, FileDataPopulatorOptions } from './FileDataPopulator'

export interface AudioFileMetadataPopulatorProps {
	audioDurationField?: SugaredFieldProps['field']
}

export class AudioFileMetadataPopulator implements FileDataPopulator<HTMLAudioElement> {
	public constructor(public readonly props: AudioFileMetadataPopulatorProps) {}

	public getStaticFields() {
		return !!this.props.audioDurationField && <SugaredField field={this.props.audioDurationField} />
	}

	public canHandleFile(file: File) {
		return isAudio(file) && !!this.props.audioDurationField
	}

	public async prepareFileData(file: File, previewUrl: string): Promise<HTMLAudioElement> {
		return new Promise((resolve, reject) => {
			const audio = document.createElement('audio')
			audio.addEventListener('canplay', () => {
				resolve(audio)
			})
			audio.addEventListener('error', () => {
				reject()
			})
			audio.src = previewUrl
		})
	}

	public populateFileData(options: FileDataPopulatorOptions, audioElement: HTMLAudioElement) {
		const desugaredAudioDurationField = QueryLanguage.desugarRelativeSingleField(
			this.props.audioDurationField!,
			options.environment,
		)
		options.batchUpdates(getAccessor => {
			getAccessor().getRelativeSingleField<number>(desugaredAudioDurationField).updateValue(audioElement.duration)
		})
	}
}
