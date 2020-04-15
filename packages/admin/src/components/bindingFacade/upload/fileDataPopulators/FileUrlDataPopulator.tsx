import { BindingError, QueryLanguage, SugaredField, SugaredFieldProps } from '@contember/binding'
import { S3FileUploader } from '@contember/client'
import * as React from 'react'
import { FileDataPopulator, FileDataPopulatorOptions } from './FileDataPopulator'

export interface FileUrlDataPopulatorProps {
	fileUrlField: SugaredFieldProps['field']
}

export class FileUrlDataPopulator implements FileDataPopulator<any, S3FileUploader.SuccessMetadata> {
	public constructor(public readonly props: FileUrlDataPopulatorProps) {}

	public getStaticFields() {
		return <SugaredField field={this.props.fileUrlField} />
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

		const desugaredFileUrlField = QueryLanguage.desugarRelativeSingleField(this.props.fileUrlField, options.environment)
		options.batchUpdates(getAccessor => {
			getAccessor()
				.getRelativeSingleField<string>(desugaredFileUrlField)
				.updateValue?.(options.uploadResult.fileUrl)
		})
	}
}
