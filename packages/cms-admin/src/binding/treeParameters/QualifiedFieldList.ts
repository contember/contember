import { AnyField, DesugaredAnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import {
	DesugaredQualifiedEntityList,
	QualifiedEntityList,
	SugarableQualifiedEntityList,
	UnsugarableQualifiedEntityList,
} from './QualifiedEntityList'

export interface DesugaredQualifiedFieldList extends DesugaredQualifiedEntityList, DesugaredAnyField {}

export interface QualifiedFieldList extends QualifiedEntityList, AnyField {}

export interface SugarableQualifiedFieldList extends SugarableQualifiedEntityList, SugarableAnyField {}

export interface UnsugarableQualifiedFieldList extends UnsugarableQualifiedEntityList, UnsugarableAnyField {}

// E.g. Author[age < 123].son.sister.name
export interface SugaredQualifiedFieldList extends UnsugarableQualifiedFieldList {
	qualifiedFieldList: string | SugarableQualifiedFieldList
}
