import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import Header from '../common/Header'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function Login({ onSignIn, onSignUp }) {
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const isSignUp = mode === 'signup'

  const changeMode = () => {
    setMode(isSignUp ? 'login' : 'signup')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const data = await onSignUp(email, password)

        if (!data.session) {
          setMessage(
            'Check your inbox to confirm your account.'
          )
          setMode('login')
          setPassword('')
          setConfirmPassword('')
        }
      } else {
        await onSignIn(email, password)
      }
    } catch {
      setError(
        isSignUp
          ? 'Unable to create your account. Check your details and try again.'
          : 'Unable to sign in. Check your email and password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <Header />
      <main id="main" className="auth-layout">
        <section className="auth-form" aria-labelledby="auth-title">
          <span className="step-label">YOUR READING WORKSPACE</span>
          <h1 id="auth-title">{isSignUp ? 'Create your account.' : 'Welcome back.'}</h1>
          <p className="auth-subtitle">{isSignUp ? 'A fresh start for your reading.' : 'Good to see you again.'}</p>
          <div className="segmented auth-modes" role="group" aria-label="Account access">
            <button type="button" className={!isSignUp ? 'selected' : ''} aria-pressed={!isSignUp} onClick={() => isSignUp && changeMode()} disabled={loading}>Sign in</button>
            <button type="button" className={isSignUp ? 'selected' : ''} aria-pressed={isSignUp} onClick={() => !isSignUp && changeMode()} disabled={loading}>Create account</button>
          </div>
          <form onSubmit={handleSubmit} className="auth-fields">
            <div><label htmlFor="email">Email address</label><Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} disabled={loading} required /></div>
            <div><label htmlFor="password">Password</label><div className="password-field"><Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} minLength={isSignUp ? 6 : undefined} disabled={loading} required /><button className="icon-button" type="button" title={showPassword ? 'Hide password' : 'Show password'} aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{isSignUp && <span className="field-hint">At least 6 characters</span>}</div>
            {isSignUp && <div><label htmlFor="confirm-password">Confirm password</label><Input id="confirm-password" name="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={6} disabled={loading} required /></div>}
            {error && <p role="alert" className="notice notice--error">{error}</p>}
            {message && <p role="status" className="notice notice--success">{message}</p>}
            <Button type="submit" disabled={loading} className="auth-submit">{loading ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}{loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}</Button>
          </form>
        </section>
      </main>
    </div>
  )
}
