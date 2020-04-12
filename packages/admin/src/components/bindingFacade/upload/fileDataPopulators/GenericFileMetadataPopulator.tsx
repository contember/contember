import { QueryLanguage, SugaredField, SugaredFieldProps } from '@contember/binding'
import * as React from 'react'
import { FileDataPopulator, FileDataPopulatorOptions } from './FileDataPopulator'

export interface GenericFileMetadataPopulatorProps {
	fileNameField?: SugaredFieldProps['field']
	lastModifiedField?: SugaredFieldProps['field']
	sizeField?: SugaredFieldProps['field']
	typeField?: SugaredFieldProps['field']
}

export class GenericFileMetadataPopulator implements FileDataPopulator {
	public constructor(public readonly props: GenericFileMetadataPopulatorProps) {}

	public getStaticFields() {
		return (
			<>
				{!!this.props.fileNameField && <SugaredField field={this.props.fileNameField} />}
				{!!this.props.lastModifiedField && <SugaredField field={this.props.lastModifiedField} />}
				{!!this.props.sizeField && <SugaredField field={this.props.sizeField} />}
				{!!this.props.typeField && <SugaredField field={this.props.typeField} />}
			</>
		)
	}

	public canHandleFile(file: File) {
		return (
			!!this.props.fileNameField || !!this.props.lastModifiedField || !!this.props.sizeField || !!this.props.typeField
		)
	}

	public populateFileData(options: FileDataPopulatorOptions) {
		options.batchUpdates(getAccessor => {
			if (this.props.fileNameField) {
				const fileNameField = QueryLanguage.desugarRelativeSingleField(this.props.fileNameField, options.environment)
				getAccessor()
					.getRelativeSingleField<string>(fileNameField)
					.updateValue?.(options.file.name)
			}
			if (this.props.lastModifiedField) {
				const lastModifiedField = QueryLanguage.desugarRelativeSingleField(
					this.props.lastModifiedField,
					options.environment,
				)
				getAccessor()
					.getRelativeSingleField<number>(lastModifiedField)
					.updateValue?.(options.file.lastModified)
			}
			if (this.props.sizeField) {
				const sizeField = QueryLanguage.desugarRelativeSingleField(this.props.sizeField, options.environment)
				getAccessor()
					.getRelativeSingleField<number>(sizeField)
					.updateValue?.(options.file.size)
			}
			if (this.props.typeField) {
				const typeField = QueryLanguage.desugarRelativeSingleField(this.props.typeField, options.environment)
				getAccessor()
					.getRelativeSingleField<string>(typeField)
					.updateValue?.(options.file.type)
			}
		})
	}
}
