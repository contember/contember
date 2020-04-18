import { Environment, FieldValue, SugaredField, SugaredFieldProps } from '@contember/binding'
import * as React from 'react'
import { FileDataPopulator, FileDataPopulatorOptions } from '../fileDataPopulators'

export interface DiscriminatedFileDataPopulatorProps {
	discriminationField: SugaredFieldProps['field']
}

export class DiscriminatedFileDataPopulator implements FileDataPopulator<FieldValue> {
	public constructor(public readonly props: DiscriminatedFileDataPopulatorProps) {}

	public getStaticFields(environment: Environment) {
		return <SugaredField field={this.props.discriminationField} />
	}

	public isUrgent() {
		return true
	}

	public populateFileData(options: FileDataPopulatorOptions, fileData: FieldValue) {}
}
