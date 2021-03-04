import { Component } from '@contember/binding'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import {
	FileDataPopulator,
	FileUrlDataPopulator,
	GenericFileMetadataPopulator,
	GenericFileMetadataPopulatorProps,
} from '../fileDataPopulators'
import { UploadField, UploadFieldRenderingProps } from '../core'
import { getGenericFileDefaults } from '../stockFileKindDefaults'

export type FileUploadFieldProps = SimpleRelativeSingleFieldProps &
	UploadFieldRenderingProps &
	GenericFileMetadataPopulatorProps & {
		additionalFileDataPopulators?: Iterable<FileDataPopulator>
	}

// TODO this is super temporary
export const FileUploadField: FunctionComponent<FileUploadFieldProps> = Component(props => {
	const defaults = getGenericFileDefaults(props.field)
	return (
		<UploadField
			{...props}
			accept={defaults.accept}
			fileUrlField={props.field}
			fileDataPopulators={[
				...(props.additionalFileDataPopulators || []),
				new FileUrlDataPopulator({ fileUrlField: props.field }),
				new GenericFileMetadataPopulator(props),
			]}
			renderFilePreview={defaults.renderFilePreview}
			renderFile={defaults.renderFile}
		/>
	)
}, 'FileUploadField')
