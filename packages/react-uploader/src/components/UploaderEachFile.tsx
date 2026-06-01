import { UploaderFileStateContext } from '../contexts.js'
import { ReactNode } from 'react'
import { UploaderFileState } from '../types/state.js'
import { useUploaderStateFiles } from '../hooks/index.js'

export const UploaderEachFile = ({ children, state, fallback }: {
	children: ReactNode
	state?: UploaderFileState['state'] | UploaderFileState['state'][]
	fallback?: ReactNode
}) => {
	const files = useUploaderStateFiles({ state })
	if (files.length === 0) {
		return <>{fallback}</>
	}
	return (
		<>
			{files.map(fileState => (
				<UploaderFileStateContext.Provider key={fileState.file.id} value={fileState}>
					{children}
				</UploaderFileStateContext.Provider>
			))}
		</>
	)
}
