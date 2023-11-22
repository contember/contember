import { GraphQlField, GraphQlFragment, GraphQlFragmentSpread, GraphQlInlineFragment } from '../../../builder'

export const mutationFragments: Record<string, GraphQlFragment> = {
	MutationError: new GraphQlFragment('MutationError', '_MutationError', [
		new GraphQlField(null, 'paths', {}, [
			new GraphQlInlineFragment('_FieldPathFragment', [
				new GraphQlField(null, 'field'),
			]),
			new GraphQlInlineFragment('_IndexPathFragment', [
				new GraphQlField(null, 'index'),
				new GraphQlField(null, 'alias'),
			]),
		]),
		new GraphQlField(null, 'message'),
		new GraphQlField(null, 'type'),
	]),
	TransactionResult: new GraphQlFragment('TransactionResult', 'TransactionResult', [
		new GraphQlField(null, 'ok'),
		new GraphQlField(null, 'errorMessage'),
		new GraphQlField(null, 'errors', {}, [
			new GraphQlField(null, 'paths', {}, [
				new GraphQlInlineFragment('_FieldPathFragment', [
					new GraphQlField(null, 'field'),
				]),
				new GraphQlInlineFragment('_IndexPathFragment', [
					new GraphQlField(null, 'index'),
					new GraphQlField(null, 'alias'),
				]),
			]),
		]),
		new GraphQlField(null, 'validation', {}, [
			new GraphQlFragmentSpread('ValidationResult'),
		]),
	]),
	ValidationResult: new GraphQlFragment('ValidationResult', '_ValidationResult', [
		new GraphQlField(null, 'valid'),
		new GraphQlField(null, 'errors', {}, [
			new GraphQlField(null, 'path', {}, [
				new GraphQlInlineFragment('_FieldPathFragment', [
					new GraphQlField(null, 'field'),
				]),
				new GraphQlInlineFragment('_IndexPathFragment', [
					new GraphQlField(null, 'index'),
					new GraphQlField(null, 'alias'),
				]),
			]),
			new GraphQlField(null, 'message', {}, [
				new GraphQlField(null, 'text'),
			]),
		]),
	]),
}
