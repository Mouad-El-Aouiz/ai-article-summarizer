import { LoaderCircle } from 'lucide-react'
export default function LoadingSpinner({ text = 'Loading...', fullScreen = false }) {
  return <div role="status" className={fullScreen ? 'loading-state loading-state--fullscreen' : 'loading-state'}><LoaderCircle className="spin" size={22} /><span>{text}</span></div>
}
