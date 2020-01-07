import * as React from 'react'
import { ClientConfig, ClientConfigContext } from './config'
import { ProjectSlugContext, StageSlugContext } from './project'

export interface ClientProps {
	children: React.ReactNode
	config: ClientConfig
	project?: string
	stage?: string
}

export const Client = React.memo((props: ClientProps) => (
	<ClientConfigContext.Provider value={props.config}>
		<ProjectSlugContext.Provider value={props.project}>
			<StageSlugContext.Provider value={props.stage}>{props.children}</StageSlugContext.Provider>
		</ProjectSlugContext.Provider>
	</ClientConfigContext.Provider>
))
Client.displayName = 'Client'
