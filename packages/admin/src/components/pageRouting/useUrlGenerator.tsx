import { useSelector } from 'react-redux'
import RequestState from '../../state/request'
import State from '../../state'
import { requestStateToPath } from '../../routing'

export const useUrlGenerator = () => {
	const basePath = useSelector<State, State['basePath']>(({ basePath }) => basePath)
	const projectConfig = useSelector<State, State['projectConfig']>(({ projectConfig }) => projectConfig)

	return (request: RequestState): string => {
		return requestStateToPath(basePath, projectConfig, request)
	}
}
