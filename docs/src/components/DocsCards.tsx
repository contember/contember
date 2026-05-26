interface Props {
	className?: string
	children?: unknown
}

/** Responsive grid wrapper around a set of <DocsCard>. */
export default function DocsCards(props: Props) {
	return <div className={props.className ? `docs-cards ${props.className}` : 'docs-cards'}>{props.children}</div>
}
