import { QueryLanguage, SugaredField, SugaredFieldProps } from '@contember/binding'
import type { FileDataPopulator, FileDataPopulatorOptions } from './FileDataPopulator'

export interface GenericFileMetadataPopulatorProps {
	fileNameField?: SugaredFieldProps['field']
	lastModifiedField?: SugaredFieldProps['field']
	fileSizeField?: SugaredFieldProps['field']
	fileTypeField?: SugaredFieldProps['field']
}

export class GenericFileMetadataPopulator implements FileDataPopulator {
	public constructor(public readonly props: GenericFileMetadataPopulatorProps) {}

	public getStaticFields() {
		return (
			<>
				{!!this.props.fileNameField && <SugaredField field={this.props.fileNameField} />}
				{!!this.props.lastModifiedField && <SugaredField field={this.props.lastModifiedField} />}
				{!!this.props.fileSizeField && <SugaredField field={this.props.fileSizeField} />}
				{!!this.props.fileTypeField && <SugaredField field={this.props.fileTypeField} />}
			</>
		)
	}

	public canHandleFile(file: File) {
		return (
			!!this.props.fileNameField ||
			!!this.props.lastModifiedField ||
			!!this.props.fileSizeField ||
			!!this.props.fileTypeField
		)
	}

	public populateFileData(options: FileDataPopulatorOptions) {
		options.getFileAccessor().batchUpdates(getAccessor => {
			if (this.props.fileNameField) {
				const fileNameField = QueryLanguage.desugarRelativeSingleField(this.props.fileNameField, options.environment)
				getAccessor().getRelativeSingleField<string>(fileNameField).updateValue(options.file.name)
			}
			if (this.props.lastModifiedField) {
				const lastModifiedField = QueryLanguage.desugarRelativeSingleField(
					this.props.lastModifiedField,
					options.environment,
				)
				getAccessor().getRelativeSingleField<number>(lastModifiedField).updateValue(options.file.lastModified)
			}
			if (this.props.fileSizeField) {
				const fileSizeField = QueryLanguage.desugarRelativeSingleField(this.props.fileSizeField, options.environment)
				getAccessor().getRelativeSingleField<number>(fileSizeField).updateValue(options.file.size)
			}
			if (this.props.fileTypeField) {
				const fileTypeField = QueryLanguage.desugarRelativeSingleField(this.props.fileTypeField, options.environment)
				getAccessor().getRelativeSingleField<string>(fileTypeField).updateValue(options.file.type)
			}
		})
	}
}
