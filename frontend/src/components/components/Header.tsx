import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Github } from 'lucide-react'

export default function Header() {
  return (
    <header className="w-full border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left Side: Main Logo/Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-black rounded-lg">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-900">CI Agent</h1>
            <Badge variant="secondary" className="text-xs">
              Multi-Agent
            </Badge>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Github className="h-4 w-4 mr-2" />
            GitHub
          </Button>
        </div>
        
      </div>
    </header>
  )
}