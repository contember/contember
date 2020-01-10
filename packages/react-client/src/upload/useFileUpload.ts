import { GenerateUploadUrlMutationBuilder } from '@contember/client'
import * as React from 'react'
import { useSessionToken } from '../auth'
import { useCurrentContentGraphQlClient } from '../content'
import { FileId } from './FileId'
import { FileUploadActionType } from './FileUploadActionType'
import { FileUploadCompoundState } from './FileUploadCompoundState'
import { CancelUpload, FileUploadOperations, StartUpload } from './FileUploadOperations'
import { FileUploadReadyState } from './FileUploadReadyState'
import { fileUploadReducer, initializeFileUploadState } from './fileUploadReducer'
import { readAsArrayBuffer } from './utils'

export type FileUpload = [FileUploadCompoundState, FileUploadOperations]

export interface FileUploadOptions {
	maxUpdateFrequency?: number // This does NOT apply to all kinds of updates.
	fileExpiration?: GenerateUploadUrlMutationBuilder.FileParameters['expiration']
	filePrefix?: GenerateUploadUrlMutationBuilder.FileParameters['prefix']
	fileAcl?: GenerateUploadUrlMutationBuilder.FileParameters['acl']
}

export const useFileUpload = (options?: FileUploadOptions): FileUpload => {
	const maxUpdateFrequency = options?.maxUpdateFrequency ?? 250

	const client = useCurrentContentGraphQlClient()
	const apiToken = useSessionToken()

	const updateTimeoutRef = React.useRef<number | undefined>(undefined)
	const isFirstRenderRef = React.useRef(true)

	const [uploadRequests] = React.useState(() => new Map<FileId, XMLHttpRequest>())
	const [multiTemporalState, dispatch] = React.useReducer(fileUploadReducer, undefined, initializeFileUploadState)

	const cancelUpload = React.useCallback<CancelUpload>(
		fileIds => {
			for (const fileId of fileIds) {
				if (uploadRequests.has(fileId)) {
					uploadRequests.get(fileId)!.abort()
					uploadRequests.delete(fileId)
				}
			}
			dispatch({
				type: FileUploadActionType.Uninitialize,
				fileIds,
			})
		},
		[uploadRequests],
	)
	const startUpload = React.useCallback<StartUpload>(
		async files => {
			const existingIds: FileId[] = files.map(file => file.id).filter(id => id in multiTemporalState.liveState)

			if (existingIds.length) {
				cancelUpload(existingIds)
			}

			dispatch({
				type: FileUploadActionType.Initialize,
				filesWithMetadata: files.map(file => ({
					id: file.id,
					file: file.file,
					previewUrl: URL.createObjectURL(file.file),
				})),
			})
			const parameters: GenerateUploadUrlMutationBuilder.MutationParameters = {}
			const fileIds: FileId[] = []

			for (const file of files) {
				parameters[file.id] = {
					contentType: file.file.type,
					prefix: options?.filePrefix,
					expiration: options?.fileExpiration,
					acl: options?.fileAcl,
				}
				fileIds.push(file.id)
			}

			const mutation = GenerateUploadUrlMutationBuilder.buildQuery(parameters)
			try {
				const response = await client.sendRequest(mutation, {}, apiToken)
				const responseData: GenerateUploadUrlMutationBuilder.MutationResponse = response.data

				dispatch({
					type: FileUploadActionType.StartUploading,
					fileIds,
				})
				for (const file of files) {
					const datumBody = responseData[file.id]
					const uploadRequestBody = await readAsArrayBuffer(file.file)
					const xhr = new XMLHttpRequest()
					uploadRequests.set(file.id, xhr)

					xhr.open(datumBody.method, datumBody.url)

					for (const header of datumBody.headers) {
						xhr.setRequestHeader(header.key, header.value)
					}
					xhr.addEventListener('load', () => {
						dispatch({
							type: FileUploadActionType.FinishSuccessfully,
							fileId: file.id,
							fileUrl: datumBody.publicUrl,
						})
					})
					xhr.addEventListener('error', () => {
						dispatch({
							type: FileUploadActionType.FinishWithError,
							fileIds: [file.id],
						})
					})
					xhr.upload?.addEventListener('progress', e => {
						dispatch({
							type: FileUploadActionType.UpdateUploadProgress,
							fileId: file.id,
							progress: e.loaded / e.total,
						})
					})
					xhr.send(uploadRequestBody)
				}
			} catch (error) {
				dispatch({
					type: FileUploadActionType.FinishWithError,
					fileIds,
				})
			}
		},
		[apiToken, cancelUpload, client, multiTemporalState.liveState, options, uploadRequests],
	)

	const operations = React.useMemo<FileUploadOperations>(
		() => ({
			startUpload,
			cancelUpload,
		}),
		[cancelUpload, startUpload],
	)

	React.useEffect(() => {
		if (isFirstRenderRef.current) {
			return
		}
		if (multiTemporalState.publicState !== multiTemporalState.liveState) {
			const now = Date.now()
			const timeDelta = now - multiTemporalState.lastUpdateTime
			if (timeDelta > maxUpdateFrequency) {
				if (updateTimeoutRef.current !== undefined) {
					clearTimeout(updateTimeoutRef.current)
				}
				dispatch({
					type: FileUploadActionType.PublishNewestState,
				})
			} else {
				if (updateTimeoutRef.current === undefined) {
					updateTimeoutRef.current = window.setTimeout(() => {
						dispatch({
							type: FileUploadActionType.PublishNewestState,
						})
						updateTimeoutRef.current = undefined
					}, timeDelta)
				}
			}
		}
	}, [
		multiTemporalState.lastUpdateTime,
		multiTemporalState.liveState,
		multiTemporalState.publicState,
		maxUpdateFrequency,
	])

	React.useEffect(
		() => () => {
			for (const fileId in multiTemporalState.liveState) {
				const state = multiTemporalState.liveState[fileId]

				if (state.readyState !== FileUploadReadyState.Uninitialized && state.previewUrl !== undefined) {
					URL.revokeObjectURL(state.previewUrl)
				}
			}
		},
		[multiTemporalState.liveState],
	)

	// For this to work, this effect must be the last one to run.
	React.useEffect(() => {
		isFirstRenderRef.current = false
	}, [])

	return [multiTemporalState.publicState, operations]
}
