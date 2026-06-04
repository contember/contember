import Layout from './Layout.mustache.js'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		you just used the last of your MFA backup codes for your account ({{email}}).
		You have no backup codes left.
	</p>
	<p>
		To avoid being locked out if you lose access to your authenticator, please
		sign in and regenerate a new set of backup codes.
	</p>
`)
