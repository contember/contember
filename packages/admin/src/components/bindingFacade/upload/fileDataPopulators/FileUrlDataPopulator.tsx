import { BindingError, QueryLanguage, SugaredField, SugaredFieldProps } from '@contember/binding'
import { S3FileUploader } from '@contember/client'
import * as React from 'react'
import { isAudio, isImage, isVideo } from '../utils'
import { FileDataPopulator, FileDataPopulatorOptions } from './FileDataPopulator'

export interface FileUrlDataPopulatorProps {
	fileUrlField?: SugaredFieldProps['field']
	audioFileUrlField?: SugaredFieldProps['field']
	imageFileUrlField?: SugaredFieldProps['field']
	videoFileUrlField?: SugaredFieldProps['field']
}

export class FileUrlDataPopulator implements FileDataPopulator<any, S3FileUploader.SuccessMetadata> {
	public constructor(public readonly props: FileUrlDataPopulatorProps) {}

	public getStaticFields() {
		return (
			<>
				{this.props.fileUrlField && <SugaredField field={this.props.fileUrlField} />}
				{this.props.audioFileUrlField && <SugaredField field={this.props.audioFileUrlField} />}
				{this.props.imageFileUrlField && <SugaredField field={this.props.imageFileUrlField} />}
				{this.props.videoFileUrlField && <SugaredField field={this.props.videoFileUrlField} />}
			</>
		)
	}

	public populateFileData(options: FileDataPopulatorOptions<S3FileUploader.SuccessMetadata>) {
		if (__DEV_MODE__) {
			if (!options.uploadResult.fileUrl || typeof options.uploadResult.fileUrl !== 'string') {
				console.error('Supplied upload result:', options.uploadResult)
				throw new BindingError(
					`Cannot save uploaded file url. You likely used a custom uploader which is incompatible with ` +
						`FileUrlDataPopulator.`,
				)
			}
		}
		let targetField: SugaredFieldProps['field']

		if (this.props.imageFileUrlField && isImage(options.file)) {
			targetField = this.props.imageFileUrlField
		} else if (this.props.audioFileUrlField && isAudio(options.file)) {
			targetField = this.props.audioFileUrlField
		} else if (this.props.videoFileUrlField && isVideo(options.file)) {
			targetField = this.props.videoFileUrlField
		} else if (this.props.fileUrlField) {
			targetField = this.props.fileUrlField
		} else {
			return
		}

		const desugaredFileUrlField = QueryLanguage.desugarRelativeSingleField(targetField, options.environment)
		options.batchUpdates(getAccessor => {
			getAccessor().getRelativeSingleField<string>(desugaredFileUrlField).updateValue?.(options.uploadResult.fileUrl)
		})
	}
}
