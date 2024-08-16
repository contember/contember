import { DataViewFilterHandler } from '../../types'

export type DataViewFilterProps = {
	name: string
	filterHandler: DataViewFilterHandler<any>
}
export const DataViewFilter = ({}: DataViewFilterProps) => {
	throw new Error('Should not render')
}
