import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function Login({ onSignIn, onSignUp }) {
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
    <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <section
        aria-labelledby="auth-title"
        className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow"
      >
        <h1
          id="auth-title"
          className="text-2xl font-semibold text-gray-900 dark:text-white"
        >
          {isSignUp ? 'Create an account' : 'Sign in'}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm text-gray-700 dark:text-gray-200"
            >
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm text-gray-700 dark:text-gray-200"
            >
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isSignUp ? 6 : undefined}
              disabled={loading}
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm text-gray-700 dark:text-gray-200"
              >
                Confirm password
              </label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                disabled={loading}
                required
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-green-700 dark:text-green-400">
              {message}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? 'Please wait...'
              : isSignUp
                ? 'Create account'
                : 'Sign in'}
          </Button>
        </form>

        <button
          type="button"
          onClick={changeMode}
          disabled={loading}
          className="mt-5 w-full text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Create one"}
        </button>
      </section>
    </main>
  )
}
