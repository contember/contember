import { QueryLanguage, SugaredField, SugaredFieldProps } from '@contember/binding'
import { isVideo } from '../utils'
import { FileDataPopulator, FileDataPopulatorOptions } from './FileDataPopulator'

export interface VideoFileMetadataPopulatorProps {
	videoWidthField?: SugaredFieldProps['field']
	videoHeightField?: SugaredFieldProps['field']
	videoDurationField?: SugaredFieldProps['field']
}

export class VideoFileMetadataPopulator implements FileDataPopulator<HTMLVideoElement> {
	public constructor(public readonly props: VideoFileMetadataPopulatorProps) {}

	public getStaticFields() {
		return (
			<>
				{!!this.props.videoWidthField && <SugaredField field={this.props.videoWidthField} />}
				{!!this.props.videoHeightField && <SugaredField field={this.props.videoHeightField} />}
				{!!this.props.videoDurationField && <SugaredField field={this.props.videoDurationField} />}
			</>
		)
	}

	public canHandleFile(file: File) {
		return (
			isVideo(file) &&
			(!!this.props.videoWidthField || !!this.props.videoHeightField || !!this.props.videoDurationField)
		)
	}

	public async prepareFileData(file: File, previewUrl: string): Promise<HTMLVideoElement> {
		return new Promise((resolve, reject) => {
			const video = document.createElement('video')
			video.addEventListener('canplay', () => {
				resolve(video)
			})
			video.addEventListener('error', () => {
				reject()
			})
			video.src = previewUrl
		})
	}

	public populateFileData(options: FileDataPopulatorOptions, videoElement: HTMLVideoElement) {
		options.batchUpdates(getAccessor => {
			if (this.props.videoWidthField) {
				const videoWidthField = QueryLanguage.desugarRelativeSingleField(
					this.props.videoWidthField,
					options.environment,
				)
				getAccessor().getRelativeSingleField<number>(videoWidthField).updateValue(videoElement.videoWidth)
			}
			if (this.props.videoHeightField) {
				const videoHeightField = QueryLanguage.desugarRelativeSingleField(
					this.props.videoHeightField,
					options.environment,
				)
				getAccessor().getRelativeSingleField<number>(videoHeightField).updateValue(videoElement.videoHeight)
			}
			if (this.props.videoDurationField) {
				const videoDurationField = QueryLanguage.desugarRelativeSingleField(
					this.props.videoDurationField,
					options.environment,
				)
				getAccessor().getRelativeSingleField<number>(videoDurationField).updateValue(videoElement.duration)
			}
		})
	}
}
