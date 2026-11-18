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
import { SingleFieldSubscriptionsRule } from './rules/SingleFieldSubscriptionsRule.js'

// Field validation
import { FieldsOnCorrectTypeRule } from './rules/FieldsOnCorrectTypeRule.js'
import { ScalarLeafsRule } from './rules/ScalarLeafsRule.js'
import { OverlappingFieldsCanBeMergedRule } from './rules/OverlappingFieldsCanBeMergedRule.js'

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
import { NoUnusedVariablesRule } from './rules/NoUnusedVariablesRule.js'
import { VariablesAreInputTypesRule } from './rules/VariablesAreInputTypesRule.js'
import { VariablesInAllowedPositionRule } from './rules/VariablesInAllowedPositionRule.js'
import { UniqueVariableNamesRule } from './rules/UniqueVariableNamesRule.js'

// Type validation
import { KnownTypeNamesRule } from './rules/KnownTypeNamesRule.js'

// Introspection validation
import { MaxIntrospectionDepthRule } from './rules/MaxIntrospectionDepthRule.js'

// Directive validation
import { KnownDirectivesRule } from './rules/KnownDirectivesRule.js'
import { UniqueDirectivesPerLocationRule } from './rules/UniqueDirectivesPerLocationRule.js'

/**
 * This set includes all validation rules defined by the GraphQL spec, plus the rules graphql-js recommends.
 *
 * The order matches graphql-js `specifiedRules`, so errors are reported in the same order.
 */
export const specifiedRules: ReadonlyArray<ValidationRule> = Object.freeze([
	ExecutableDefinitionsRule,
	UniqueOperationNamesRule,
	LoneAnonymousOperationRule,
	SingleFieldSubscriptionsRule,
	KnownTypeNamesRule,
	FragmentsOnCompositeTypesRule,
	VariablesAreInputTypesRule,
	ScalarLeafsRule,
	FieldsOnCorrectTypeRule,
	UniqueFragmentNamesRule,
	KnownFragmentNamesRule,
	NoUnusedFragmentsRule,
	PossibleFragmentSpreadsRule,
	NoFragmentCyclesRule,
	UniqueVariableNamesRule,
	NoUndefinedVariablesRule,
	NoUnusedVariablesRule,
	KnownDirectivesRule,
	UniqueDirectivesPerLocationRule,
	KnownArgumentNamesRule,
	UniqueArgumentNamesRule,
	ValuesOfCorrectTypeRule,
	ProvidedRequiredArgumentsRule,
	VariablesInAllowedPositionRule,
	OverlappingFieldsCanBeMergedRule,
	UniqueInputFieldNamesRule,
	MaxIntrospectionDepthRule,
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
	MaxIntrospectionDepthRule,
	NoFragmentCyclesRule,
	// Variable validation
	NoUndefinedVariablesRule,
	NoUnusedFragmentsRule,
	NoUnusedVariablesRule,
	OverlappingFieldsCanBeMergedRule,
	PossibleFragmentSpreadsRule,
	ProvidedRequiredArgumentsRule,
	ScalarLeafsRule,
	SingleFieldSubscriptionsRule,
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
