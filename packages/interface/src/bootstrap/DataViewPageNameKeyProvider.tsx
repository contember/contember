import { useCurrentRequest } from '@contember/react-routing'
import { DataViewKeyProvider } from '@contember/react-dataview'
import { ReactNode } from 'react'

export const DataViewPageNameKeyProvider = ({ children }: { children: ReactNode }) => {
	const pageName = useCurrentRequest()?.pageName

	return (
		<DataViewKeyProvider value={pageName ?? ''}>
			{children}
		</DataViewKeyProvider>
	)
}
