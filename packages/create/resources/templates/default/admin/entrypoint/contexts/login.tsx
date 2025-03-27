import { createRequiredContext } from '@contember/react-utils'
import { PropsWithChildren } from 'react'

export type LoginConfig = {
	appUrl: string
	hasTokenFromEnv: boolean
	idps: Record<string, string>
	magicLink: boolean
}

const [LoginConfigContext, useLoginConfig] = createRequiredContext<LoginConfig>('LoginConfigContext')
export { LoginConfigContext, useLoginConfig }

export const LoginConfigProvider = ({ children, ...config }: PropsWithChildren<LoginConfig>) => (
	<LoginConfigContext.Provider value={config}>
		{children}
	</LoginConfigContext.Provider>
)
