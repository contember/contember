import { useEnvironment } from '@contember/react-binding'
import { Link } from '@contember/react-routing'
import { AnchorButton } from '~/lib/ui/button'

export const ToggleRequired = () => {
	const required = !!useEnvironment().getParameterOrElse('required', false)

	return (
		<Link to={it => it ? ({ pageName: it.pageName, parameters: { required: !required ? '1' : '' } }) : it}>
			<AnchorButton variant="outline">
				{required ? 'Turn off required' : 'Turn on required'}
			</AnchorButton>
		</Link>
	)
}
