import { ReactNode } from 'react'
import { UploaderFileState } from '../types'
import { useUploaderStateFiles } from '../hooks'

export const UploaderHasFile = ({ children, state, fallback }: {
	children: ReactNode
	fallback?: ReactNode
	state?: UploaderFileState['state'] | UploaderFileState['state'][]
}) => {
	const matchingFiles = useUploaderStateFiles({ state })
	return matchingFiles.length > 0 ? <>{children}</> : <>{fallback}</>
}
