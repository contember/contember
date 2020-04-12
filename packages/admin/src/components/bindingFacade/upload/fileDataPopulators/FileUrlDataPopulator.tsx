import { QueryLanguage, SugaredField, SugaredFieldProps } from '@contember/binding'
import { S3FileUploader } from '@contember/client'
import * as React from 'react'
import { FileDataPopulator, FileDataPopulatorOptions } from './FileDataPopulator'

export interface FileUrlDataPopulatorProps {
	field: SugaredFieldProps['field']
}

export class FileUrlDataPopulator implements FileDataPopulator<S3FileUploader.SuccessMetadata> {
	public constructor(public readonly props: FileUrlDataPopulatorProps) {}

	public getStaticFields() {
		return <SugaredField field={this.props.field} />
	}

	public canHandleFile(file: File, uploadResult: S3FileUploader.SuccessMetadata) {
		return 'fileUrl' in uploadResult && typeof uploadResult.fileUrl === 'string'
	}

	public populateFileData(options: FileDataPopulatorOptions<S3FileUploader.SuccessMetadata>) {
		const desugaredFileUrlField = QueryLanguage.desugarRelativeSingleField(this.props.field, options.environment)
		options.batchUpdates(getAccessor => {
			getAccessor()
				.getRelativeSingleField<string>(desugaredFileUrlField)
				.updateValue?.(options.uploadResult.fileUrl)
		})
	}
}
