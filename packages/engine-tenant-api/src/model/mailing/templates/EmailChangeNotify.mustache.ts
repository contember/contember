import Layout from './Layout.mustache.js'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		the e-mail address on your account was changed to {{newEmail}}.<br>
		If you did not make this change, contact support immediately — your account
		may have been compromised.
	</p>
`)
