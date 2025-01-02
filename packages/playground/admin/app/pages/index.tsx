import { Binding } from '~/lib/binding'
import { Slots } from '~/lib/layout'

export default () => (
	<Binding>
		<Slots.Title>
			<h1>Welcome to Contember playground</h1>
		</Slots.Title>

		<div className="prose prose-lg max-w-2xl">
			<div className="space-y-6">
				<p className="text-gray-700">
					This is a place where you can find examples of how to use the Contember framework.
					Explore examples of various components, page creation, data views, forms, blocks,
					layout components, and much more.
				</p>

				<p className="text-gray-700">
					You can find the source code of this playground in the{' '}
					<a
						href="https://github.com/contember/contember/tree/main/packages/playground"
						className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Visit Contember repository (opens in new tab)"
					>
						Contember repository
					</a>
					.
				</p>
			</div>
		</div>
	</Binding>
)
