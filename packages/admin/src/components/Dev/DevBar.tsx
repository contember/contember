import { ReactNode } from 'react'
import { DevBar } from '@contember/react-devbar'
import { IdentityPanel } from './IdentityPanel'
import { ApiPanel } from './ApiPanel'
import { Identity2023 } from '@contember/brand'

export const ApplicationDevBar = ({ panels }: { panels?: ReactNode }) => {
	if (!import.meta.env.DEV) {
		return null
	}
	return (
		<DevBar brand={(
			<a href="https://docs.contember.com/" target="_blank" rel="noreferrer">
				<Identity2023.LogoIcon />
			</a>)}
		>
			<IdentityPanel />
			<ApiPanel />
			{panels}
		</DevBar>
	)
}
