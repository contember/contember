import {
	Component,
	Field,
	FieldValue,
	QueryLanguage,
	SugaredRelativeSingleField,
	wrapFilterInHasOnes,
} from '@contember/binding'
import { Checkbox, FieldContainer, Stack } from '@contember/ui'
import type { FunctionComponent, ReactElement, ReactNode } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { DataGridColumn, DataGridColumnPublicProps, DataGridOrderDirection } from '../base'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'
import { createGenericTextCellFilterCondition, GenericTextCellFilter } from './GenericTextCellFilter'

export type TextCellProps =
	& DataGridColumnPublicProps
	& FieldFallbackViewPublicProps
	& SugaredRelativeSingleField
	& {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		format?: (value: string | null) => ReactNode
	}

export type TextFilterArtifacts = {
	mode: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query: string
	nullCondition: boolean
}

/**
 * DataGrid cell for displaying a content of text field.
 *
 * @example
 * ```
 * <TextCell field="author.name" header="Author name" />
 * ```
 *
 * @group Data grid
 */
export const TextCell: FunctionComponent<TextCellProps> = Component(props => {
	return (
		<DataGridColumn<TextFilterArtifacts>
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			getNewFilter={(filter, { environment }) => {
				if (filter.query === '' && filter.nullCondition === false) {
					return undefined
				}

				let condition = filter.query !== '' ? createGenericTextCellFilterCondition(filter) : {}

				if (filter.mode === 'doesNotMatch') {
					if (filter.nullCondition) {
						condition = {
							and: [condition, { isNull: false }],
						}
					}
				} else if (filter.nullCondition) {
					condition = {
						or: [condition, { isNull: true }],
					}
				}

				const desugared = QueryLanguage.desugarRelativeSingleField(props, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: condition,
				})
			}}
			emptyFilter={{
				mode: 'matches',
				query: '',
				nullCondition: false,
			}}
			filterRenderer={({ filter, setFilter, ...props }) => {
				const formatMessage = useMessageFormatter(dataGridCellsDictionary)
				return (
					<Stack direction="horizontal">
						<GenericTextCellFilter {...props} filter={filter} setFilter={setFilter} />
							<FieldContainer
								label={<span style={{ whiteSpace: 'nowrap' }}>
									{filter.mode === 'doesNotMatch'
										? formatMessage('dataGridCells.textCell.excludeNull', {
												strong: chunks => <strong>{chunks}</strong>,
											})
										: formatMessage('dataGridCells.textCell.includeNull', {
												strong: chunks => <strong>{chunks}</strong>,
											})}
									</span>}
								labelPosition="labelInlineRight"
							>
								<Checkbox
									notNull
									value={filter.nullCondition}
									onChange={checked => {
										setFilter({
											...filter,
											nullCondition: !!checked,
										})
									}}
								/>
							</FieldContainer>
					</Stack>
				)
			}}
		>
			<Field<string>
				{...props}
				format={value => {
					if (value === null) {
						return <FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
					}
					if (props.format) {
						return props.format(value as any)
					}
					return value
				}}
			/>
		</DataGridColumn>
	)
}, 'TextCell')
