import { AnyField, DesugaredAnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import { DesugaredLeafField, LeafField, SugarableLeafField, UnsugarableLeafField } from './LeafField'
import {
	DesugaredQualifiedEntityList,
	QualifiedEntityList,
	SugarableQualifiedEntityList,
	UnsugarableQualifiedEntityList,
} from './QualifiedEntityList'

export interface DesugaredQualifiedFieldList
	extends DesugaredQualifiedEntityList,
		DesugaredAnyField,
		DesugaredLeafField {}

export interface QualifiedFieldList extends QualifiedEntityList, AnyField, LeafField {}

export interface SugarableQualifiedFieldList
	extends SugarableQualifiedEntityList,
		SugarableAnyField,
		SugarableLeafField {}

export interface UnsugarableQualifiedFieldList
	extends UnsugarableQualifiedEntityList,
		UnsugarableAnyField,
		UnsugarableLeafField {}

// E.g. Author[age < 123].son.sister.name
export interface SugaredQualifiedFieldList extends UnsugarableQualifiedFieldList {
	fields: string | SugarableQualifiedFieldList
}
