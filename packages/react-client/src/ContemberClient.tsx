import * as React from 'react'
import { SessionTokenContext } from './auth'
import { ApiBaseUrlContext, LoginTokenContext } from './config'
import { ProjectSlugContext, StageSlugContext } from './project'

export type ContemberClientProps = {
	children: React.ReactNode
	apiBaseUrl: string
} & (
	| {
			sessionToken: string
			project: string
			stage: string
			loginToken?: string
	  }
	| {
			sessionToken?: string
			project?: string
			stage?: string
			loginToken: string
	  }
)

export const ContemberClient = React.memo(function ContemberClient({
	apiBaseUrl,
	children,
	loginToken,
	project,
	sessionToken,
	stage,
}: ContemberClientProps) {
	return (
		<ApiBaseUrlContext.Provider value={apiBaseUrl}>
			<LoginTokenContext.Provider value={loginToken}>
				<SessionTokenContext.Provider value={sessionToken}>
					<ProjectSlugContext.Provider value={project}>
						<StageSlugContext.Provider value={stage}>{children}</StageSlugContext.Provider>
					</ProjectSlugContext.Provider>
				</SessionTokenContext.Provider>
			</LoginTokenContext.Provider>
		</ApiBaseUrlContext.Provider>
	)
})
