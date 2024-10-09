export const Layout = ({ children }: { children?: React.ReactNode }) => (
	<div className="grid md:grid-cols-2 min-h-screen ">
		<div className="bg-gray-100 p-4 flex items-center justify-center">
			{children}
		</div>
		<div className="bg-gray-700 text-white p-4 flex items-center justify-center">
			<div className="w-full max-w-md">
				<div className="text-center text-2xl">Welcome to your app</div>
				<p className="mt-8 text-center text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor, sem
					eget ultricies ultricies, sapien urna tristique eros, ac tincidunt felis lacus nec nunc.</p>
			</div>
		</div>
	</div>
)
