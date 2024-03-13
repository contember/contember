import { UploaderFileState } from '../types'
import { useUploaderState } from '../contexts'
import { useMemo } from 'react'

export type UseUploaderStateFilesArgs = {
	state?: UploaderFileState['state'] | UploaderFileState['state'][]
}

export const useUploaderStateFiles = ({ state }: UseUploaderStateFilesArgs = {}) => {
	const uploaderState = useUploaderState()
	return useMemo(() => {
		return !state ? uploaderState : uploaderState.filter(fileState => {
			if (state) {
				return Array.isArray(state) ? state.includes(fileState.state) : fileState.state === state
			}
			return true
		})
	}, [state, uploaderState])
}
