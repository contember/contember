import { BindingError, Entity } from '@contember/binding'
import type { FileId, SingleFileUploadState } from '@contember/react-client'
import { ActionableBox, Box, toEnumViewClass } from '@contember/ui'
import { memo, ReactElement, useMemo } from 'react'
import type { MessageFormatter } from '../../../../../i18n'
import type { UploadDictionary } from '../../uploadDictionary'
import { ErrorFilePreview } from './ErrorFilePreview'
import { InitializedFilePreview } from './InitializedFilePreview'
import { InitializingFilePreview } from './InitializingFilePreview'
import { UploadedFilePreview } from './UploadedFilePreview'
import { ResolvedFileEntity } from '../../fileHandler'

export interface SingleFilePreviewProps {
	resolvedEntity: ResolvedFileEntity
	fileId: FileId
	formatMessage: MessageFormatter<UploadDictionary>
	removeFile: ((fileId: FileId) => void) | undefined
	uploadState: SingleFileUploadState | undefined
}

const viewFromMimeTypeRegExp = new RegExp(/^(\w+).*/)

function viewFromMimeType(mimeType: string | string[] | undefined | null) {
	if (!mimeType) return

	return (Array.isArray(mimeType) ? mimeType[0] : mimeType).replace(viewFromMimeTypeRegExp, '$1')
}

export const SingleFilePreview = memo(
	({ fileId, resolvedEntity, formatMessage, removeFile, uploadState }: SingleFilePreviewProps) => {
		let preview: ReactElement | null = null

		const onRemove = useMemo(() => {
			if (!removeFile) {
				return undefined
			}
			return () => {
				removeFile(fileId)
			}
		}, [fileId, removeFile])


		if (uploadState !== undefined) {
			if (uploadState.readyState === 'initializing') {
				return <InitializingFilePreview formatMessage={formatMessage} />
			}
			if (uploadState.readyState === 'error' && resolvedEntity.fileKind === undefined) {
				preview = <ErrorFilePreview uploadState={uploadState} formatMessage={formatMessage} />
			} else {
				if (resolvedEntity.fileKind === undefined) {
					throw new BindingError()
				}
				preview = (
					<InitializedFilePreview
						fileKind={resolvedEntity.fileKind}
						formatMessage={formatMessage}
						resolvedEntity={resolvedEntity}
						uploadState={uploadState}
					/>
				)
			}
		} else if (!resolvedEntity.isEmpty) {
			preview = <UploadedFilePreview fileKind={resolvedEntity.fileKind} />
		} else {
			return null
		}
		const editContents = resolvedEntity.fileKind && resolvedEntity.fileKind.children ? <Box>{resolvedEntity.fileKind.children}</Box> : undefined

		const box = (
			<ActionableBox className={toEnumViewClass(viewFromMimeType(resolvedEntity.fileKind?.acceptMimeTypes))} onRemove={onRemove} editContents={editContents}>
				{preview}
			</ActionableBox>
		)
		return resolvedEntity.fileEntity
			? (
				<Entity accessor={resolvedEntity.fileEntity}>
					{box}
				</Entity>
			)
			: box
	},
)
SingleFilePreview.displayName = 'SingleFilePreview'
