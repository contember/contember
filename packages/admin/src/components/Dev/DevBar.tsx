import React, { ReactNode } from 'react'
import { DevBar } from '@contember/ui'
import { IdentityPanel } from './IdentityPanel'
import { ApiPanel } from './ApiPanel'

export const ApplicationDevBar = ({ panels }: { panels?: ReactNode }) => {
	if (!import.meta.env.DEV) {
		return null
	}
	return (
		<DevBar>
			<IdentityPanel />
			<ApiPanel />
			{panels}
		</DevBar>
	)
}
