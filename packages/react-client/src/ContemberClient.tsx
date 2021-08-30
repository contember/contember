import { memo, ReactNode } from 'react'
import { SessionTokenContext } from './auth'
import { ApiBaseUrlContext, LoginTokenContext } from './config'
import { ProjectSlugContext, StageSlugContext } from './project'

export interface ContemberClientProps {
	apiBaseUrl: string
	sessionToken?: string
	loginToken?: string
	project?: string
	stage?: string
}

export const ContemberClient = memo<ContemberClientProps & {children: React.ReactNode}>(function ContemberClient({
	apiBaseUrl,
	children,
	loginToken,
	project,
	sessionToken,
	stage,
}) {
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
