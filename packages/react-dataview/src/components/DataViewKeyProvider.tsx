import { DataViewGlobalKeyContext } from '../contexts'
import { EnvironmentMiddleware } from '@contember/react-binding'
import { dataViewKeyEnvironmentExtension } from '../env/dataViewKeyEnvironmentExtension'

export const DataViewKeyProvider = ({ children, value }: { children: React.ReactNode; value: string }) => {
	return (
		<DataViewGlobalKeyContext.Provider value={value}>
			<EnvironmentMiddleware create={env => env.withExtension(dataViewKeyEnvironmentExtension, value)}>
				{children}
			</EnvironmentMiddleware>
		</DataViewGlobalKeyContext.Provider>
	)
}
