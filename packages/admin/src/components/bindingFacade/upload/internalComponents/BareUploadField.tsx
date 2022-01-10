import { Component, EntityAccessor, HasOne, SugaredField, useEntity, useEnvironment } from '@contember/binding'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { useMessageFormatter } from '../../../../i18n'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { uploadDictionary } from '../uploadDictionary'
import { getEntityFileKind, hasUploadedFile, staticRenderFileKind } from '../utils'
import type { FileInputPublicProps } from './FileInput'
import { FileInput } from './FileInput'
import { SingleFilePreview } from './SingleFilePreview'
import { useNormalizedUploadState } from './useNormalizedUploadState'
import { useAccessorErrorFormatter } from '../../errors'

export interface BareUploadFieldProps extends FileInputPublicProps {
	fileKinds: ResolvedFileKinds
}

export const BareUploadField = Component<BareUploadFieldProps>(
	({ fileKinds: unstableFileKinds, ...fileInputProps }) => {
		const parentEntity = useEntity()
		const [fileKinds] = useState(() => unstableFileKinds)
		const formatMessage = useMessageFormatter(uploadDictionary)

		const prepareEntityForNewFile = useCallback<(initialize: EntityAccessor.BatchUpdatesHandler) => void>(
			initialize => parentEntity.batchUpdates(initialize),
			[parentEntity],
		)

		const { uploadState, dropzoneState, removeFile } = useNormalizedUploadState({
			isMultiple: false,
			fileKinds,
			prepareEntityForNewFile,
		})

		const fileUploadState = uploadState.get(parentEntity.key)
		const parentWithBase =
			fileKinds.isDiscriminated && fileKinds.baseEntity !== undefined
				? parentEntity.getEntity(fileKinds.baseEntity)
				: parentEntity

		const environment = useEnvironment()
		const errorFormatter = useAccessorErrorFormatter()
		const fileKind = getEntityFileKind(fileKinds, parentWithBase.getAccessor)
		const extractorEntity = fileKind?.baseEntity ? parentWithBase.getEntity(fileKind.baseEntity) : parentWithBase
		const extractorsErrors = useMemo(
			() => fileKind?.extractors.flatMap(it => it.getErrorsHolders?.({ entity: extractorEntity, environment }) ?? []) ?? [],
			[environment, extractorEntity, fileKind?.extractors],
		)
		const errors = useMemo(
			() => [
				parentWithBase,
				...(parentWithBase === extractorEntity ? [] : [extractorEntity]),
				...extractorsErrors,
			].flatMap(it => errorFormatter(it.errors?.errors ?? [])),
			[errorFormatter, extractorEntity, extractorsErrors, parentWithBase],
		)

		const children =
			hasUploadedFile(fileKinds, parentWithBase) || fileUploadState !== undefined ? (
				<div className="fileInput-preview">
					<SingleFilePreview
						getContainingEntity={parentEntity.getAccessor}
						fileId={parentEntity.key}
						formatMessage={formatMessage}
						removeFile={removeFile}
						uploadState={uploadState.get(parentEntity.key)}
						fileKinds={fileKinds}
					/>
				</div>
			) : undefined

		return (
			<FileInput
				{...fileInputProps}
				dropzoneState={dropzoneState}
				formatMessage={formatMessage}
				errors={errors}
				children={children}
			/>
		)
	},
	(props, environment) => {
		if (props.fileKinds.isDiscriminated) {
			const children = (
				<>
					<SugaredField field={props.fileKinds.discriminationField} isNonbearing />
					{Array.from(props.fileKinds.fileKinds.values(), (fileKind, i) => (
						<Fragment key={i}>{staticRenderFileKind(fileKind.datum, environment)}</Fragment>
					))}
				</>
			)
			return props.fileKinds.baseEntity === undefined ? (
				children
			) : (
				<HasOne field={props.fileKinds.baseEntity}>{children}</HasOne>
			)
		}
		return staticRenderFileKind(props.fileKinds.fileKind, environment)
	},
	'BareUploadField',
)
