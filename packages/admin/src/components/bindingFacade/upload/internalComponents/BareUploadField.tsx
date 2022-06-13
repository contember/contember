import {
	Component,
	EntityAccessor,
	HasOne,
	QueryLanguage,
	SugaredField,
	useEntity,
	useEnvironment,
} from '@contember/binding'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { useMessageFormatter } from '../../../../i18n'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { uploadDictionary } from '../uploadDictionary'
import { hasUploadedFile, staticRenderFileKind } from '../utils'
import type { FileInputPublicProps } from './FileInput'
import { FileInput } from './FileInput'
import { SingleFilePreview } from './SingleFilePreview'
import { useNormalizedUploadState } from '../hooks/useNormalizedUploadState'
import { useConnectSelectedEntities } from '../hooks/useConnectSelectedEntities'
import { FileId, useFileUpload } from '@contember/react-client'
import { useRemoveUploadedFile } from '../hooks/useRemoveUploadedFile'
import { useFileEntitiesErrors } from '../hooks/useFileEntitiesErrors'

export type BareUploadFieldProps =
	& FileInputPublicProps
	& {
		fileKinds: ResolvedFileKinds
	}

export const BareUploadField = Component<BareUploadFieldProps>(
	({ fileKinds: unstableFileKinds, ...fileInputProps }) => {
		const parentEntity = useEntity()
		const [fileKinds] = useState(() => unstableFileKinds)
		const formatMessage = useMessageFormatter(uploadDictionary)

		const fileUpload = useFileUpload()
		const [, { purgeUpload }] = fileUpload
		const removeUploadedFile = useRemoveUploadedFile(fileKinds)
		const environment = useEnvironment()
		const removeFile = useCallback((fileId: FileId) => {
			purgeUpload([fileId])
			const baseEntity = fileKinds.isDiscriminated ? fileKinds.baseEntity : fileKinds.fileKind.baseEntity
			if (baseEntity) {
				const desugaredBase = QueryLanguage.desugarRelativeSingleEntity(baseEntity, environment)
				parentEntity.disconnectEntityAtField(desugaredBase.hasOneRelationPath[0].field)
			} else {
				removeUploadedFile(fileId)
			}
		}, [fileKinds, parentEntity, purgeUpload, removeUploadedFile, environment])

		const prepareEntityForNewFile = useCallback<(initialize: EntityAccessor.BatchUpdatesHandler) => void>(
			initialize => {
				removeFile(parentEntity.key)
				parentEntity.batchUpdates(initialize)
			},
			[parentEntity, removeFile],
		)
		const { uploadState, dropzoneState } = useNormalizedUploadState({
			isMultiple: false,
			fileKinds,
			prepareEntityForNewFile,
			fileUpload,
		})

		const fileUploadState = uploadState.get(parentEntity.key)
		const parentWithBase =
			fileKinds.isDiscriminated && fileKinds.baseEntity !== undefined
				? parentEntity.getEntity(fileKinds.baseEntity)
				: parentEntity

		const errors = useFileEntitiesErrors(useMemo(() => [parentEntity], [parentEntity]), fileKinds)

		const children = hasUploadedFile(fileKinds, parentWithBase) || fileUploadState !== undefined
			? (
				<div className="fileInput-preview">
					<SingleFilePreview
						containingEntity={parentEntity}
						fileId={parentEntity.key}
						formatMessage={formatMessage}
						removeFile={removeFile}
						uploadState={uploadState.get(parentEntity.key)}
						fileKinds={fileKinds}
					/>
				</div>
			)
			: undefined

		const onSelectConfirm = useConnectSelectedEntities(fileKinds, prepareEntityForNewFile)

		return (
			<FileInput
				{...fileInputProps}
				fileKinds={fileKinds}
				isMultiple={false}
				dropzoneState={dropzoneState}
				formatMessage={formatMessage}
				errors={errors}
				children={children}
				onSelectConfirm={onSelectConfirm}
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
			return props.fileKinds.baseEntity === undefined
				? children
				: (
					<HasOne field={props.fileKinds.baseEntity}>{children}</HasOne>
				)
		}
		return staticRenderFileKind(props.fileKinds.fileKind, environment)
	},
	'BareUploadField',
)
