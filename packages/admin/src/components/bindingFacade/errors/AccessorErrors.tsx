import { EntityAccessor, EntityListAccessor, FieldAccessor } from '@contember/binding'
import { ErrorList, ErrorListProps } from '@contember/ui'
import { ReactElement } from 'react'
import { useAccessorErrors } from './useAccessorErrors'

export interface AccessorErrorsProps extends Omit<ErrorListProps, 'errors'> {
	accessor: FieldAccessor | EntityAccessor | EntityListAccessor
}

export function AccessorErrors({ accessor, ...errorListProps }: AccessorErrorsProps): ReactElement | null {
	return <ErrorList {...errorListProps} errors={useAccessorErrors(accessor)} />
}
