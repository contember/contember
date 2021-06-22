import { BindingError, Entity, EntityAccessor } from '@contember/binding'
import type { FileId, SingleFileUploadState } from '@contember/react-client'
import { ActionableBox, Box } from '@contember/ui'
import { memo, ReactElement, useMemo } from 'react'
import type { FullFileKind } from '../../interfaces'
import type { ResolvedFileKinds } from '../../ResolvedFileKinds'
import { getEntityFileKind, hasUploadedFile } from '../../utils'
import { ErrorFilePreview } from './ErrorFilePreview'
import { InitializedFilePreview } from './InitializedFilePreview'
import { InitializingFilePreview } from './InitializingFilePreview'
import { UploadedFilePreview } from './UploadedFilePreview'

export interface SingleFilePreviewProps {
	getContainingEntity: EntityAccessor.GetEntityAccessor
	fileId: FileId
	removeFile: ((fileId: FileId) => void) | undefined
	uploadState: SingleFileUploadState | undefined
	fileKinds: ResolvedFileKinds
}

export const SingleFilePreview = memo(
	({ fileId, fileKinds, getContainingEntity, removeFile, uploadState }: SingleFilePreviewProps) => {
		let fileKind: FullFileKind | undefined
		let preview: ReactElement | null = null

		const onRemove = useMemo(() => {
			if (!removeFile) {
				return undefined
			}
			return () => {
				removeFile(fileId)
			}
		}, [fileId, removeFile])

		if (fileKinds.isDiscriminated && fileKinds.baseEntity !== undefined) {
			getContainingEntity = getContainingEntity().getEntity(fileKinds.baseEntity).getAccessor
		}

		if (uploadState !== undefined) {
			if (uploadState.readyState === 'initializing') {
				return <InitializingFilePreview />
			}
			fileKind = getEntityFileKind(fileKinds, getContainingEntity)

			if (uploadState.readyState === 'error' && fileKind === undefined) {
				fileKind = undefined
				preview = <ErrorFilePreview uploadState={uploadState} />
			} else {
				if (fileKind === undefined) {
					throw new BindingError()
				}
				preview = (
					<InitializedFilePreview
						fileKind={fileKind}
						getContainingEntity={getContainingEntity}
						uploadState={uploadState}
					/>
				)
			}
		} else if (hasUploadedFile(fileKinds, getContainingEntity())) {
			fileKind = getEntityFileKind(fileKinds, getContainingEntity)

			if (fileKind === undefined) {
				throw new BindingError()
			}
			preview = <UploadedFilePreview fileKind={fileKind} />
		} else {
			return null
		}
		const editContents = fileKind && fileKind.children ? <Box>{fileKind.children}</Box> : undefined
		const containingEntity =
			!fileKind || fileKind.baseEntity === undefined
				? getContainingEntity()
				: getContainingEntity().getEntity(fileKind.baseEntity)

		return (
			<Entity accessor={containingEntity}>
				<ActionableBox onRemove={onRemove} editContents={editContents}>
					{preview}
				</ActionableBox>
			</Entity>
		)
	},
)
SingleFilePreview.displayName = 'SingleFilePreview'
