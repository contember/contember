import * as React from 'react'
import { ClientConfig, ClientConfigContext } from './config'
import { ProjectAndStage, ProjectAndStageContext } from './project'

export interface ClientProps {
	children: React.ReactNode
	config: ClientConfig
	projectAndStage: ProjectAndStage | undefined
}

export const Client = React.memo((props: ClientProps) => (
	<ClientConfigContext.Provider value={props.config}>
		<ProjectAndStageContext.Provider value={props.projectAndStage}>{props.children}</ProjectAndStageContext.Provider>
	</ClientConfigContext.Provider>
))
Client.displayName = 'Client'
