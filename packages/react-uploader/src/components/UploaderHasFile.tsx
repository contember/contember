import { ReactNode } from 'react'
import { UploaderFileState } from '../types/index.js'
import { useUploaderStateFiles } from '../hooks/index.js'

export const UploaderHasFile = ({ children, state, fallback }: {
	children: ReactNode
	fallback?: ReactNode
	state?: UploaderFileState['state'] | UploaderFileState['state'][]
}) => {
	const matchingFiles = useUploaderStateFiles({ state })
	return matchingFiles.length > 0 ? <>{children}</> : <>{fallback}</>
}
