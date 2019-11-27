import { AnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import {
	QualifiedEntityList,
	SugarableQualifiedEntityList,
	UnsugarableQualifiedEntityList,
} from './QualifiedEntityList'

export interface QualifiedFieldList extends QualifiedEntityList, AnyField {}

export interface SugarableQualifiedFieldList extends SugarableQualifiedEntityList, SugarableAnyField {}

export interface UnsugarableQualifiedFieldList extends UnsugarableQualifiedEntityList, UnsugarableAnyField {}

// E.g. Author[age < 123].son.sister.name
export interface SugaredQualifiedFieldList extends UnsugarableQualifiedFieldList {
	qualifiedFieldList: string | SugarableQualifiedFieldList
}
