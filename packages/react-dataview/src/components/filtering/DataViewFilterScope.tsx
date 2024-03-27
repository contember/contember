import { DataViewFilterNameContext } from '../../contexts'

export const DataViewFilterScope = ({ name, children }: {name: string, children: React.ReactNode}) => {
	return (
		<DataViewFilterNameContext.Provider value={name}>
			{children}
		</DataViewFilterNameContext.Provider>
	)
}
