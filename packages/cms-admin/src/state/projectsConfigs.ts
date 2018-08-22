import { RouteMap } from '../components/pageRouting/utils'

export interface ProjectConfig {
	project: string
	stage: string
	component: () => Promise<React.ReactNode>
	routes: RouteMap
}

export default interface ProjectsConfigsState {
	configs: ProjectConfig[]
}

export const emptyProjectsConfigsState: ProjectsConfigsState = {
	configs: []
}
