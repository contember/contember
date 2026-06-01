import { DataViewGlobalKeyContext } from '../contexts.js'
import { EnvironmentMiddleware } from '@contember/react-binding'
import { dataViewKeyEnvironmentExtension } from '../env/dataViewKeyEnvironmentExtension.js'

/**
 * The `DataViewKeyProvider` component is responsible for providing a global key for the DataView.
 * This global key is primarily used to distinguish between multiple DataViews, such as when storing or retrieving state in local storage.
 */
export const DataViewKeyProvider = ({ children, value }: { children: React.ReactNode; value: string }) => {
	return (
		<DataViewGlobalKeyContext.Provider value={value}>
			<EnvironmentMiddleware create={env => env.withExtension(dataViewKeyEnvironmentExtension, value)}>
				{children}
			</EnvironmentMiddleware>
		</DataViewGlobalKeyContext.Provider>
	)
}
