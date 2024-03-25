import { useDataViewFilterHandlerRegistry } from '../../contexts'

export interface DataViewHasFilterTypeProps {
	name: string
	children: React.ReactNode
}
export const DataViewHasFilterType = ({ name, children }: DataViewHasFilterTypeProps) => {
	const types = useDataViewFilterHandlerRegistry()
	return types[name] ? <>{children}</> : null
}
