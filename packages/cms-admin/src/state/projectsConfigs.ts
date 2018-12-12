import { RouteMap } from '../components/pageRouting/utils'
import { ComponentType } from 'react'

export interface ProjectConfig {
	project: string
	stage: string
	component: () => Promise<{ default: ComponentType }>
	routes: RouteMap
}

export default interface ProjectsConfigsState {
	configs: ProjectConfig[]
}

export const emptyProjectsConfigsState: ProjectsConfigsState = {
	configs: []
}
