import Layout from './Layout.mustache'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		Someone just tried to register a new account using your email address ({{email}}).
		If this was you, you can sign in with your existing account or reset your password instead.
		If it was not you, no action is required — your account is unchanged.
	</p>
`)
