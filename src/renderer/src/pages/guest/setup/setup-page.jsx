import Loading from '@/components/loading'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GuestSetupPage() {
  const navigate = useNavigate()

  const [publicKey, setPublicKey] = useState('')
  const [isLoading, setLoading] = useState(false)

  const connect = () => {
    if (publicKey.length === 0) return

    window.ipc.send('guest', { publicKey })

    window.ipc.on(window.api.Constants.LISTENING, (_, { publicKey }) => {
      setTimeout(() => {
        navigate('/guest/' + publicKey)
      }, 2000)
    })
  }

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <Loading />
      </div>
    )

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex flex-col space-y-3 w-full max-w-96">
        <Textarea
          className="w-full"
          value={publicKey}
          placeholder="Share key"
          onChange={(event) => setPublicKey(event.target.value)}
        ></Textarea>
        <Button className="w-full" onClick={() => connect()}>
          Continue
        </Button>
      </div>
    </div>
  )
}
