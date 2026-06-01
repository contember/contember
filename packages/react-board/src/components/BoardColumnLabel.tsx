import { useBoardCurrentColumn } from '../contexts.js'

export const BoardColumnLabel = () => {
	const value = useBoardCurrentColumn().value
	return value && 'label' in value ? <>{value.label}</> : null
}
