import { FieldAccessor, FieldValue } from '@contember/react-binding'
import { ReactElement } from 'react'

export type FieldValueRenderer<FV extends FieldValue = string> = (value: FV | null | undefined, fieldAccessor: FieldAccessor<FV>) => ReactElement
