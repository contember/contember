import Layout from './Layout.mustache'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		a change of the e-mail address on your account to {{email}} was requested.<br>
		To confirm this new address, copy &amp; paste the following token and follow
		the instructions in the e-mail change interface:<br>
		<code>{{token}}</code>
	</p>
	<p>If you did not request this change, you can ignore this e-mail.</p>
`)
