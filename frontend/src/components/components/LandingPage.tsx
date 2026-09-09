import { useState } from 'react'
import CompanySearchCard from './CompanySearchCard'
import CompetitorDiscoveryChat from './CompetitorDiscoveryChat'
import CompareCompaniesForm from './CompareCompaniesForm'
import Footer from './Footer'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Search, Compass, GitCompare } from 'lucide-react'

interface LandingPageProps {
  onAnalyze: (opts: { company: string; url?: string; section: string }) => void
  onCompare: (company1?: string, company2?: string, section?: string) => void
}

export default function LandingPage({ onAnalyze, onCompare }: LandingPageProps) {
  const [mode, setMode] = useState<'analyze' | 'discover' | 'compare'>('analyze')

  return (
    <div 
      className="h-screen overflow-hidden"
      style={{ 
        backgroundColor: '#0a0a0a',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
        style={{ 
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          borderColor: '#262626'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
                <h1 
                className="text-xl font-bold"
                style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  color: '#f9f9f9',
                  fontFamily: 'Inter, sans-serif',
                  textShadow: '0 0 10px #facc15, 0 0 20px #facc15, 0 0 30px #facc15'
                }}
              >
                <span style={{ color: '#facc15' }}>I</span>nfo-Ninja
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                className="font-bold transition-all duration-200 hover:brightness-110 hover:scale-105"
                style={{
                  backgroundColor: '#facc15',
                  color: '#0a0a0a',
                  borderRadius: '9999px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(250,204,21,0.4)'
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-16 h-full overflow-hidden">
        <section 
          className="px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative h-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 100%)'
          }}
        >
          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #facc15 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }}
          />
          
          <div className="max-w-4xl mx-auto text-center relative">
            {/* Badge/Label */}
            <Badge 
              className="mb-6 text-sm font-medium"
              style={{
                backgroundColor: '#111111',
                color: '#facc15',
                border: '1px solid #262626',
                borderRadius: '9999px',
                padding: '4px 12px',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              🚀 AI-Powered Intelligence Platform
            </Badge>

            {/* Giant Headline */}
            <h1 
              className="font-bold mb-6 leading-tight"
              style={{
                fontSize: '64px',
                fontWeight: 700,
                color: '#f9f9f9',
                lineHeight: 1.4,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: 'tight',
                marginBottom: '32px'
              }}
            >
              Transform Competitive Research with{' '}
              <span style={{ color: '#facc15' }}>AI Agents</span>
            </h1>

            {/* Mode Toggle */}
            <div className="flex justify-center mb-8">
              <div className="relative flex rounded-full p-1" style={{ backgroundColor: '#1a1a1a', border: '1px solid #262626' }}>
                {/* Animated pill background */}
                <div
                  className="absolute rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    backgroundColor: '#FACC15',
                    height: 'calc(100% - 8px)',
                    top: '4px',
                    left: mode === 'analyze' ? '4px' : mode === 'discover' ? 'calc(33.333% + 1.333px)' : 'calc(66.666% + 2.666px)',
                    width: 'calc(33.333% - 2.666px)',
                    boxShadow: '0 2px 8px rgba(250,204,21,0.4)',
                  }}
                />
                <button
                  onClick={() => setMode('analyze')}
                  className={`relative z-10 px-4 md:px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 flex items-center space-x-1 md:space-x-2 ${
                    mode === 'analyze' 
                      ? 'text-black' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Analyze Competitor</span>
                  <span className="sm:hidden">Analyze</span>
                </button>
                <button
                  onClick={() => setMode('discover')}
                  className={`relative z-10 px-4 md:px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 flex items-center space-x-1 md:space-x-2 ${
                    mode === 'discover' 
                      ? 'text-black' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span className="hidden sm:inline">Discover Competitors</span>
                  <span className="sm:hidden">Discover</span>
                </button>
                <button
                  onClick={() => setMode('compare')}
                  className={`relative z-10 px-4 md:px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 flex items-center space-x-1 md:space-x-2 ${
                    mode === 'compare' 
                      ? 'text-black' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  <span className="hidden sm:inline">Compare Companies</span>
                  <span className="sm:hidden">Compare</span>
                </button>
              </div>
            </div>

            {/* Dynamic Interface */}
            <div className="mb-8">
              {mode === 'analyze' ? (
                <CompanySearchCard onAnalyze={onAnalyze} />
              ) : mode === 'discover' ? (
                <CompetitorDiscoveryChat onAnalyze={onAnalyze} />
              ) : (
                <CompareCompaniesForm onCompare={onCompare} />
              )}
            </div>

            {/* Muted Subtitle - moved below the interface */}
            <p 
              className="text-xl mb-8 max-w-2xl mx-auto"
              style={{
                fontSize: '18px',
                fontWeight: 400,
                color: '#a1a1aa',
                lineHeight: 1.4,
                marginTop: '32px'
              }}
            >
              Get comprehensive competitive intelligence in minutes, not weeks. Our multi-agent AI system 
              researches, analyzes, and delivers executive-ready insights automatically.
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}