import Layout from './Layout.mustache.js'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		a sign-in to your account ({{email}}) requires a one-time verification code:
	</p>
	<p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">{{code}}</p>
	<p>
		Enter this code to finish signing in. It expires shortly. If you did not try to
		sign in, you can safely ignore this email.
	</p>
`)
