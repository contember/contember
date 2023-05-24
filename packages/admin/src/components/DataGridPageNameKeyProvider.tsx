import { useCurrentRequest } from '../routing'
import { DataGridKeyProvider } from '@contember/react-datagrid'
import { ReactNode } from 'react'

export const DataGridPageNameKeyProvider = ({ children }: { children: ReactNode }) => {
	const pageName = useCurrentRequest()?.pageName

	return (
		<DataGridKeyProvider value={pageName ?? ''}>
			{children}
		</DataGridKeyProvider>
	)
}
