import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Link } from 'react-router-dom'

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex flex-col space-y-10 max-w-96">
        <div className="flex flex-col items-center">
          <Label className="text-2xl text-primary">PeerShare</Label>
          <Label className="text-lg text-muted-foreground text-justify">
            Welcome to PeerShare, to get started choose what you are below.
          </Label>
        </div>
        <div className="flex flex-col space-y-3">
          <Link to="/host-setup">
            <Button className="w-full">Host</Button>
          </Link>
          <Link to="/guest-setup">
            <Button className="w-full">Guest</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
