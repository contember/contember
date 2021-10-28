import { BindingError, Entity, EntityAccessor } from '@contember/binding'
import type { FileId, SingleFileUploadState } from '@contember/react-client'
import { ActionableBox, Box, toEnumViewClass } from '@contember/ui'
import { memo, ReactElement, useMemo } from 'react'
import type { MessageFormatter } from '../../../../../i18n'
import type { FullFileKind } from '../../interfaces'
import type { ResolvedFileKinds } from '../../ResolvedFileKinds'
import type { UploadDictionary } from '../../uploadDictionary'
import { getEntityFileKind, hasUploadedFile } from '../../utils'
import { ErrorFilePreview } from './ErrorFilePreview'
import { InitializedFilePreview } from './InitializedFilePreview'
import { InitializingFilePreview } from './InitializingFilePreview'
import { UploadedFilePreview } from './UploadedFilePreview'

export interface SingleFilePreviewProps {
	getContainingEntity: EntityAccessor.GetEntityAccessor
	fileId: FileId
	formatMessage: MessageFormatter<UploadDictionary>
	removeFile: ((fileId: FileId) => void) | undefined
	uploadState: SingleFileUploadState | undefined
	fileKinds: ResolvedFileKinds
}

const viewFromMimeTypeRegExp = new RegExp(/^(\w+).*/)

function viewFromMimeType(mimeType: string | string[] | undefined | null) {
	if (!mimeType) return

	return (Array.isArray(mimeType) ? mimeType[0] : mimeType).replace(viewFromMimeTypeRegExp, '$1')
}

export const SingleFilePreview = memo(
	({ fileId, fileKinds, formatMessage, getContainingEntity, removeFile, uploadState }: SingleFilePreviewProps) => {
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
				return <InitializingFilePreview formatMessage={formatMessage} />
			}
			fileKind = getEntityFileKind(fileKinds, getContainingEntity)

			if (uploadState.readyState === 'error' && fileKind === undefined) {
				fileKind = undefined
				preview = <ErrorFilePreview uploadState={uploadState} formatMessage={formatMessage} />
			} else {
				if (fileKind === undefined) {
					throw new BindingError()
				}
				preview = (
					<InitializedFilePreview
						fileKind={fileKind}
						formatMessage={formatMessage}
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
				<ActionableBox className={toEnumViewClass(viewFromMimeType(fileKind?.acceptMimeTypes))} onRemove={onRemove} editContents={editContents}>
					{preview}
				</ActionableBox>
			</Entity>
		)
	},
)
SingleFilePreview.displayName = 'SingleFilePreview'
