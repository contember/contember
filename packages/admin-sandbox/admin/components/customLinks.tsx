import {
	Block,
	Box,
	Button,
	Component,
	DiscriminatedBlocks,
	Dropdown,
	EditorRenderElementProps,
	EditorTransforms,
	HasOne,
	Icon,
	InitializeReferenceContentProps,
	SelectField,
	TextField,
	useEditor,
} from '@contember/admin'
import './editorButton.css'

export const LinkTarget = Component(() => (
		<DiscriminatedBlocks field={'link.type'} label={undefined}>
			<Block discriminateBy={'internal'} label={'Internal'}>
				<HasOne field={'link'}>
					<SelectField
						label={'URL'}
						field="internalLink"
						options="Url.url"
					/>
				</HasOne>
			</Block>
			<Block discriminateBy={'external'} label={'External'}>
				<TextField field={'link.externalLink'} label={'URL'} />
			</Block>
		</DiscriminatedBlocks>
	),
)

export const InsertLink = Component<InitializeReferenceContentProps>(
	({ onSuccess, onCancel }) => (
		<>
			<LinkTarget />
			<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1em', minWidth: '350px' }}>
				<Button onClick={onCancel}>Cancel</Button>
				<Button distinction="primary" onClick={() => onSuccess({ createElement: { type: 'link' } })}>Insert</Button>
			</div>
		</>
	),
	() => <LinkTarget />,
)


export const LinkElement = (props: EditorRenderElementProps) => {
	const editor = useEditor()
	return (
		<span {...props.attributes} style={{ color: '#0094FF' }}>
			{props.children}
			<span contentEditable={false}>
				<Dropdown
					renderToggle={({ ref, onClick }) => (
						<button ref={ref as any} onClick={onClick} className="editorButton">
							<Icon blueprintIcon="link" />
						</button>
					)}
				>
					<Box>
						<LinkTarget />
						<Button size="small" onClick={() => EditorTransforms.unwrapNodes(editor, { at: [], match: node => node === props.element })}>
							Remove link
						</Button>
					</Box>
				</Dropdown>
			</span>
		</span>
	)
}
