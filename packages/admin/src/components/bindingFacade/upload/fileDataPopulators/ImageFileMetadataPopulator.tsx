import { QueryLanguage, SugaredField, SugaredFieldProps } from '@contember/binding'
import * as React from 'react'
import { populateGenericFileMetadataFields } from '../populateGenericFileMetadataFields'
import { populateImageFileMetadataFields } from '../populateImageFileMetadataFields'
import { isAudio, isImage } from '../utils'
import { FileDataPopulator, FileDataPopulatorOptions } from './FileDataPopulator'

export interface ImageFileMetadataPopulatorProps {
	imageWidthField?: SugaredFieldProps['field']
	imageHeightField?: SugaredFieldProps['field']
}

export class ImageFileMetadataPopulator implements FileDataPopulator<HTMLImageElement> {
	public constructor(public readonly props: ImageFileMetadataPopulatorProps) {}

	public getStaticFields() {
		return (
			<>
				{!!this.props.imageWidthField && <SugaredField field={this.props.imageWidthField} />}
				{!!this.props.imageHeightField && <SugaredField field={this.props.imageHeightField} />}
			</>
		)
	}

	public canHandleFile(file: File) {
		return isImage(file) && (!!this.props.imageWidthField || !!this.props.imageHeightField)
	}

	public async prepareFileData(file: File, previewUrl: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const image = new Image()
			image.addEventListener('load', () => {
				resolve(image)
			})
			image.addEventListener('error', () => {
				reject()
			})
			image.src = previewUrl
		})
	}

	public populateFileData(options: FileDataPopulatorOptions, imageElement: HTMLImageElement) {
		options.batchUpdates(getAccessor => {
			if (this.props.imageWidthField) {
				const imageWidthField = QueryLanguage.desugarRelativeSingleField(
					this.props.imageWidthField,
					options.environment,
				)
				getAccessor()
					.getRelativeSingleField<number>(imageWidthField)
					.updateValue?.(imageElement.naturalWidth)
			}
			if (this.props.imageHeightField) {
				const imageHeightField = QueryLanguage.desugarRelativeSingleField(
					this.props.imageHeightField,
					options.environment,
				)
				getAccessor()
					.getRelativeSingleField<number>(imageHeightField)
					.updateValue?.(imageElement.naturalHeight)
			}
		})
	}
}
