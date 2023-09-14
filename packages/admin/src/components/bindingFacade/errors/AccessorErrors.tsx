import type { EntityAccessor, EntityListAccessor, FieldAccessor } from '@contember/react-binding'
import { ErrorList, ErrorListProps } from '@contember/ui'
import type { ReactElement } from 'react'
import { useAccessorErrors } from './useAccessorErrors'

export interface AccessorErrorsProps extends Omit<ErrorListProps, 'errors'> {
	accessor: FieldAccessor | EntityAccessor | EntityListAccessor
}

export function AccessorErrors({ accessor, ...errorListProps }: AccessorErrorsProps): ReactElement | null {
	return <ErrorList {...errorListProps} errors={useAccessorErrors(accessor)} />
}
