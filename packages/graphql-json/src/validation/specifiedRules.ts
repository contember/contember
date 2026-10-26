/**
 * Specified validation rules
 *
 * This set includes all validation rules defined by the GraphQL spec
 * that are implemented in this package.
 */
import type { ValidationRule } from './ValidationContext.js'

// Document validation
import { ExecutableDefinitionsRule } from './rules/ExecutableDefinitionsRule.js'
import { LoneAnonymousOperationRule } from './rules/LoneAnonymousOperationRule.js'
import { UniqueOperationNamesRule } from './rules/UniqueOperationNamesRule.js'

// Field validation
import { FieldsOnCorrectTypeRule } from './rules/FieldsOnCorrectTypeRule.js'
import { ScalarLeafsRule } from './rules/ScalarLeafsRule.js'

// Argument validation
import { KnownArgumentNamesRule } from './rules/KnownArgumentNamesRule.js'
import { ProvidedRequiredArgumentsRule } from './rules/ProvidedRequiredArgumentsRule.js'
import { UniqueArgumentNamesRule } from './rules/UniqueArgumentNamesRule.js'

// Value validation
import { ValuesOfCorrectTypeRule } from './rules/ValuesOfCorrectTypeRule.js'
import { UniqueInputFieldNamesRule } from './rules/UniqueInputFieldNamesRule.js'

// Fragment validation
import { KnownFragmentNamesRule } from './rules/KnownFragmentNamesRule.js'
import { NoUnusedFragmentsRule } from './rules/NoUnusedFragmentsRule.js'
import { PossibleFragmentSpreadsRule } from './rules/PossibleFragmentSpreadsRule.js'
import { UniqueFragmentNamesRule } from './rules/UniqueFragmentNamesRule.js'
import { FragmentsOnCompositeTypesRule } from './rules/FragmentsOnCompositeTypesRule.js'
import { NoFragmentCyclesRule } from './rules/NoFragmentCyclesRule.js'

// Variable validation
import { NoUndefinedVariablesRule } from './rules/NoUndefinedVariablesRule.js'
import { VariablesAreInputTypesRule } from './rules/VariablesAreInputTypesRule.js'
import { VariablesInAllowedPositionRule } from './rules/VariablesInAllowedPositionRule.js'
import { UniqueVariableNamesRule } from './rules/UniqueVariableNamesRule.js'

// Type validation
import { KnownTypeNamesRule } from './rules/KnownTypeNamesRule.js'

// Directive validation
import { KnownDirectivesRule } from './rules/KnownDirectivesRule.js'
import { UniqueDirectivesPerLocationRule } from './rules/UniqueDirectivesPerLocationRule.js'

/**
 * This set includes all validation rules defined by the GraphQL spec.
 *
 * The order of the rules in this list has been adjusted to lead to the
 * most clear output when encountering multiple validation errors.
 */
export const specifiedRules: ReadonlyArray<ValidationRule> = Object.freeze([
	// Document validation first
	ExecutableDefinitionsRule,
	LoneAnonymousOperationRule,
	UniqueOperationNamesRule,

	// Type checks
	KnownTypeNamesRule,

	// Field validation
	FieldsOnCorrectTypeRule,
	ScalarLeafsRule,

	// Fragment validation
	UniqueFragmentNamesRule,
	KnownFragmentNamesRule,
	NoUnusedFragmentsRule,
	FragmentsOnCompositeTypesRule,
	PossibleFragmentSpreadsRule,
	NoFragmentCyclesRule,

	// Variable validation
	UniqueVariableNamesRule,
	NoUndefinedVariablesRule,
	VariablesAreInputTypesRule,
	VariablesInAllowedPositionRule,

	// Argument validation
	KnownArgumentNamesRule,
	ProvidedRequiredArgumentsRule,
	UniqueArgumentNamesRule,

	// Value validation
	ValuesOfCorrectTypeRule,
	UniqueInputFieldNamesRule,

	// Directive validation
	KnownDirectivesRule,
	UniqueDirectivesPerLocationRule,
])

// Re-export individual rules for custom rule composition
export {
	// Document validation
	ExecutableDefinitionsRule,
	// Field validation
	FieldsOnCorrectTypeRule,
	FragmentsOnCompositeTypesRule,
	// Argument validation
	KnownArgumentNamesRule,
	// Directive validation
	KnownDirectivesRule,
	// Fragment validation
	KnownFragmentNamesRule,
	// Type validation
	KnownTypeNamesRule,
	LoneAnonymousOperationRule,
	NoFragmentCyclesRule,
	// Variable validation
	NoUndefinedVariablesRule,
	NoUnusedFragmentsRule,
	PossibleFragmentSpreadsRule,
	ProvidedRequiredArgumentsRule,
	ScalarLeafsRule,
	UniqueArgumentNamesRule,
	UniqueDirectivesPerLocationRule,
	UniqueFragmentNamesRule,
	UniqueInputFieldNamesRule,
	UniqueOperationNamesRule,
	UniqueVariableNamesRule,
	// Value validation
	ValuesOfCorrectTypeRule,
	VariablesAreInputTypesRule,
	VariablesInAllowedPositionRule,
}
