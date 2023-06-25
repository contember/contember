import { Component, EntityAccessor, useEntity } from '@contember/binding'
import { useCallback, useEffect, useMemo } from 'react'
import { useMessageFormatter } from '../../../../i18n'
import { uploadDictionary } from '../uploadDictionary'
import type { FileInputPublicProps } from './FileInput'
import { FileInput } from './FileInput'
import { SingleFilePreview } from './SingleFilePreview'
import { useNormalizedUploadState } from './hooks/useNormalizedUploadState'
import { useConnectSelectedEntities } from './hooks/useConnectSelectedEntities'
import { useFileUpload } from '@contember/react-client'
import { FileHandler } from '../fileHandler'
import { useAccessorErrorFormatter } from '../../errors'
import { ResolvedFileSelectionComponent } from './selection'

export type BareUploadFieldProps =
	& FileInputPublicProps
	& {
		fileHandler: FileHandler
		fileSelection?: ResolvedFileSelectionComponent<any>
	}

export const BareUploadField = Component<BareUploadFieldProps>(
	({ fileHandler,  ...fileInputProps }) => {
		const parentEntity = useEntity()
		const formatMessage = useMessageFormatter(uploadDictionary)

		if (import.meta.env.DEV) {
			useEffect(() => {
				if (!fileHandler.hasBaseEntity) {
					console.warn('To support all features like file removal, "baseEntity" prop should be set on a upload field component.')
				}
			}, [fileHandler.hasBaseEntity])
		}

		const fileUpload = useFileUpload()
		const [, { purgeUpload }] = fileUpload
		const resolvedEntity = useMemo(() => fileHandler.resolveEntity(parentEntity), [fileHandler, parentEntity])

		const destroyFile = useMemo(() => {
			if (!resolvedEntity.isEmpty && !resolvedEntity.destroy) {
				return undefined
			}
			return () => {
				purgeUpload([parentEntity.key])
				resolvedEntity.destroy?.()
			}
		}, [parentEntity.key, purgeUpload, resolvedEntity])

		const prepareEntityForNewFile = useCallback<(initialize: EntityAccessor.BatchUpdatesHandler) => void>(
			initialize => {
				destroyFile?.()
				parentEntity.batchUpdates(initialize)
			},
			[parentEntity, destroyFile],
		)
		const { uploadState, dropzoneState } = useNormalizedUploadState({
			isMultiple: false,
			fileHandler,
			prepareEntityForNewFile,
			fileUpload,
		})

		const fileUploadState = uploadState.get(parentEntity.key)

		const errorHolders = useMemo(() => resolvedEntity.getErrorHolders(), [resolvedEntity])
		const errorFormatter = useAccessorErrorFormatter()
		const errors = useMemo(() => {
			return errorFormatter(errorHolders.flatMap(it => it.errors?.errors ?? []))
		}, [errorFormatter, errorHolders])

		const children = !resolvedEntity.isEmpty || fileUploadState !== undefined
			? (
				<div className="fileInput-preview">
					<SingleFilePreview
						resolvedEntity={resolvedEntity}
						fileId={parentEntity.key}
						formatMessage={formatMessage}
						removeFile={destroyFile}
						uploadState={uploadState.get(parentEntity.key)}
					/>
				</div>
			)
			: undefined

		const onSelectConfirm = useConnectSelectedEntities(prepareEntityForNewFile)

		return (
			<FileInput
				{...fileInputProps}
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
		return props.fileHandler.staticRender(environment)
	},
	'BareUploadField',
)
