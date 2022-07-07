import { GenericPage, SelectFieldInner } from '@contember/admin'

export default function InnerFooPage() {
	return (
		<GenericPage
			title="Nested path"
			actions={
				<SelectFieldInner
					menuZIndex={2}
					errors={undefined}
					currentValue={null}
					onSelect={() => {}}
					onClear={() => {}}
					data={[
						{ label: 'Option 1', value: '1', key: '1', searchKeywords: '1' },
						{ label: 'Option 2', value: '2', key: '2', searchKeywords: '2' },
						{ label: 'Option 3', value: '3', key: '3', searchKeywords: '3' },
						{ label: 'Option 4', value: '4', key: '4', searchKeywords: '4' },
						{ label: 'Option 5', value: '5', key: '5', searchKeywords: '5' },
					]}
					label="Select:"
					labelPosition="labelInlineLeft"
			/>}
			side={<p><small>Hello contember world!</small></p>}
		>
			Hello from Inner Foo
		</GenericPage>
	)
}
