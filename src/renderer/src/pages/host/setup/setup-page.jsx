import Loading from '@/components/loading'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HostSetupPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const disposeableTimeout = setTimeout(() => {
      window.ipc.send('host')
      window.ipc.on(window.api.Constants.LISTENING, (_, { publicKey }) => {
        setTimeout(() => {
          navigate('/host/' + publicKey)
        }, 2000)
      })
    }, 100)

    return () => {
      clearTimeout(disposeableTimeout)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <Loading />
    </div>
  )
}
