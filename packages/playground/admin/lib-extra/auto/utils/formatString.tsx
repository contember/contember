import { SchemaColumnType } from '@contember/react-binding'

export const formatString = (type: SchemaColumnType, value: any) => {
	if (typeof value !== 'string') {
		return value

	} else if (type === 'Uuid') {
		return <span title={value}>{value.slice(0, 8)}</span>

	} else if (type === 'String') {
		return value.length > 100 ? <span title={value}>{value.slice(0, 100) + '...'}</span> : value

	} else {
		return value
	}
}
