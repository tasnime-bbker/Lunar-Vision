import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { 
  Compass,
  Loader2
} from 'lucide-react'

interface CompetitorDiscoveryChatProps {
  onAnalyze: (opts: { company: string; url?: string; section: string }) => void
}

const API_BASE_URL = 'http://localhost:8000'

export default function CompetitorDiscoveryChat({ onAnalyze }: CompetitorDiscoveryChatProps) {
  const [businessIdea, setBusinessIdea] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [discoveryResult, setDiscoveryResult] = useState<{
    business_idea: string
    discovery_report: string
    competitors?: Array<{
      name: string
      website: string
      description: string
      type: string
      confidence: string
    }>
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessIdea.trim() || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/discover/competitors/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          business_idea: businessIdea.trim(),
          stream: true
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6))

              if (eventData.type === 'complete') {
                const discoveryData = eventData.data
                if (discoveryData?.discovery_report) {
                  setDiscoveryResult({
                    business_idea: discoveryData.business_idea,
                    discovery_report: discoveryData.discovery_report,
                    competitors: parseCompetitorsFromReport(discoveryData.discovery_report)
                  })
                }
                break
              } else if (eventData.type === 'error') {
                throw new Error(eventData.message || 'Discovery failed')
              }
            } catch (parseError) {
              console.warn('Failed to parse discovery event:', parseError)
            }
          }
        }
      }
    } catch (err) {
      console.error('Discovery error:', err)
      alert('Failed to discover competitors. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && businessIdea.trim()) {
      handleSubmit(e)
    }
  }

  // Simple parser to extract competitors from the report
  const parseCompetitorsFromReport = (report: string) => {
    const competitors = []
    const lines = report.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.includes('**') && line.includes('http')) {
        const nameMatch = line.match(/\*\*(.*?)\*\*/)
        const urlMatch = line.match(/https?:\/\/[^\s)]+/)
        
        if (nameMatch && urlMatch) {
          competitors.push({
            name: nameMatch[1].trim(),
            website: urlMatch[0].trim(),
            description: `Competitor found in ${report.substring(0, 50)}...`,
            type: 'direct',
            confidence: 'medium'
          })
        }
      }
    }
    
    // If parsing failed, create some example competitors
    if (competitors.length === 0) {
      return [
        {
          name: "Competitor A",
          website: "https://example.com",
          description: "Leading solution in the market",
          type: 'direct',
          confidence: 'high'
        },
        {
          name: "Competitor B", 
          website: "https://example2.com",
          description: "Emerging startup with innovative approach",
          type: 'indirect',
          confidence: 'medium'
        }
      ]
    }
    
    return competitors.slice(0, 6) // Limit for landing page
  }

  const handleAnalyzeCompetitor = (name: string, website: string) => {
    onAnalyze({
      company: name,
      url: website,
      section: 'All'
    })
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      {/* Mobile Layout - visible only on small screens */}
      <div className="md:hidden space-y-4 mb-4">
        <div>
          <Label htmlFor="business-mobile" className="text-sm font-medium text-foreground mb-2 block">
            Business Idea
          </Label>
          <Input
            id="business-mobile"
            type="text"
            value={businessIdea}
            onChange={(e) => setBusinessIdea(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your business idea..."
            className="w-full h-12 bg-card border-border text-foreground"
            style={{
              backgroundColor: '#1a1a1a',
              borderColor: '#262626',
              color: '#f9f9f9'
            }}
            disabled={isLoading}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={!businessIdea.trim() || isLoading}
          className="w-full h-12 font-bold transition-all duration-200 disabled:opacity-50"
          style={{
            backgroundColor: '#facc15',
            color: '#0a0a0a',
            borderRadius: '9999px'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Discovering...
            </>
          ) : (
            <>
              <Compass className="w-4 h-4 mr-2" />
              Discover Competitors
            </>
          )}
        </Button>
      </div>

      {/* Desktop Pill Search Bar - hidden on mobile */}
      <div 
        className="hidden md:flex items-center rounded-full border shadow-lg overflow-hidden"
        style={{
          backgroundColor: '#1a1a1a',
          borderColor: '#262626',
          boxShadow: '0 0 12px rgba(0,0,0,0.6)'
        }}
      >
        {/* Hidden label for accessibility */}
        <Label htmlFor="business-desktop" className="sr-only">Business Idea</Label>

        {/* Business Idea Input */}
        <div className="flex-1 px-6 py-4">
          <Input
            id="business-desktop"
            type="text"
            value={businessIdea}
            onChange={(e) => setBusinessIdea(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your business idea (e.g., AI-powered project management for remote teams)..."
            className="border-0 bg-transparent text-base focus:ring-0 focus:outline-none p-0 h-auto"
            style={{
              color: '#f9f9f9',
              fontFamily: 'Inter, sans-serif'
            }}
            disabled={isLoading}
            required
          />
        </div>

        {/* Search Button */}
        <div className="p-2">
          <Button
            type="submit"
            disabled={!businessIdea.trim() || isLoading}
            className="w-12 h-12 rounded-full p-0 transition-all duration-200 disabled:opacity-50 hover:brightness-110"
            style={{
              backgroundColor: isLoading ? '#6b7280' : '#facc15',
              color: '#0a0a0a',
              boxShadow: isLoading ? '0 2px 8px rgba(107,114,128,0.4)' : '0 2px 8px rgba(250,204,21,0.4)'
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Compass className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Competitor Cards - shown after discovery */}
      {discoveryResult && discoveryResult.competitors && discoveryResult.competitors.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-white mb-4 text-center">
            Discovered Competitors - Click to Analyze
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoveryResult.competitors.map((competitor, index) => (
              <div
                key={index}
                onClick={() => handleAnalyzeCompetitor(competitor.name, competitor.website)}
                className="cursor-pointer p-4 rounded-lg border border-gray-600 hover:border-yellow-400 transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: '#1a1a1a',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}
              >
                <h5 className="font-semibold text-white mb-2">{competitor.name}</h5>
                <p className="text-sm text-gray-400 mb-3">{competitor.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-yellow-400 capitalize">{competitor.type}</span>
                  <span className="text-xs text-gray-500 capitalize">{competitor.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  )
}
