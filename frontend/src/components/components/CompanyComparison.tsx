import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Search, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Brain,
  FileText,
  Loader2,
  ArrowLeft,
  Send,
  MessageSquare,
  X
} from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
import CompetitiveDashboard from './CompetitiveDashboard'
import CompanySearchCard from './CompanySearchCard'

interface AnalysisResult {
  competitor: string
  website?: string
  research_findings: string
  strategic_analysis: string
  final_report: string
  metrics?: {
    competitive_metrics?: {
      threat_level?: number
      market_position?: number
      innovation?: number
      financial_strength?: number
      brand_recognition?: number
    }
    swot_scores?: {
      strengths?: number
      weaknesses?: number
      opportunities?: number
      threats?: number
    }
  }
  timestamp: string
  status: string
  workflow: string
}

interface CompanyAnalysisState {
  isAnalyzing: boolean
  progress: number
  currentStep: string
  result: AnalysisResult | null
  error: string | null
}

const API_BASE_URL = 'http://localhost:8000'

interface CompanyComparisonProps {
  onBack: () => void
  initialCompany1?: string
  initialCompany2?: string
}

export default function CompanyComparison({ onBack, initialCompany1, initialCompany2 }: CompanyComparisonProps) {
  const [company1, setCompany1] = useState<CompanyAnalysisState>({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    result: null,
    error: null
  })
  
  const [company2, setCompany2] = useState<CompanyAnalysisState>({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    result: null,
    error: null
  })

  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'bot', message: string}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)

  // Auto-analyze initial companies if provided
  useEffect(() => {
    if (initialCompany1 && !company1.result && !company1.isAnalyzing) {
      analyzeCompany(initialCompany1, '', 'company1')
    }
    if (initialCompany2 && !company2.result && !company2.isAnalyzing) {
      analyzeCompany(initialCompany2, '', 'company2')
    }
  }, [initialCompany1, initialCompany2])

  const analyzeCompany = async (companyName: string, companyUrl: string, slot: 'company1' | 'company2') => {
    const setState = slot === 'company1' ? setCompany1 : setCompany2
    
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      progress: 0,
      currentStep: 'Starting analysis...',
      error: null
    }))

    try {
      const response = await fetch(`${API_BASE_URL}/analyze/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          competitor_name: companyName,
          competitor_website: companyUrl || undefined,
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              handleStreamEvent(data, setState)
            } catch (e) {
              console.error('Error parsing stream data:', e)
            }
          }
        }
      }

    } catch (error) {
      console.error('Analysis failed:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Analysis failed',
        isAnalyzing: false
      }))
    }
  }

  const handleStreamEvent = (event: any, setState: React.Dispatch<React.SetStateAction<CompanyAnalysisState>>) => {
    switch (event.type) {
      case 'session_start':
        setState(prev => ({ ...prev, currentStep: 'Initializing analysis...', progress: 5 }))
        break
      case 'status_update':
        if (event.message) {
          setState(prev => ({ ...prev, currentStep: event.message }))
          // Update progress based on step
          if (event.step === 'research_start') setState(prev => ({ ...prev, progress: 20 }))
          else if (event.step === 'research_complete') setState(prev => ({ ...prev, progress: 40 }))
          else if (event.step === 'analysis_start') setState(prev => ({ ...prev, progress: 60 }))
          else if (event.step === 'analysis_complete') setState(prev => ({ ...prev, progress: 80 }))
          else if (event.step === 'report_start') setState(prev => ({ ...prev, progress: 90 }))
        }
        break
      case 'tool_call':
        if (event.tool_name) {
          setState(prev => ({ ...prev, currentStep: `Using ${event.tool_name}...` }))
        }
        break
      case 'complete':
        if (event.data) {
          setState(prev => ({
            ...prev,
            result: event.data,
            progress: 100,
            currentStep: 'Analysis complete!',
            isAnalyzing: false
          }))
        }
        break
      case 'error':
        setState(prev => ({
          ...prev,
          error: event.message || 'An error occurred during analysis',
          isAnalyzing: false
        }))
        break
    }
  }

  const handleSearch1 = (opts: { company: string; url?: string; section: string }) => {
    analyzeCompany(opts.company, opts.url || '', 'company1')
  }

  const handleSearch2 = (opts: { company: string; url?: string; section: string }) => {
    analyzeCompany(opts.company, opts.url || '', 'company2')
  }

  const handleChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }])
    
    // RAG feature removed - provide helpful fallback
    setChatMessages(prev => [...prev, { 
      type: 'bot', 
      message: 'Chat feature is currently unavailable. Please refer to the comparison analysis above for insights about these competitors.' 
    }])
  }

  const getStepIcon = (step: string) => {
    if (step.includes('research') || step.includes('Research')) {
      return <Brain className="h-4 w-4 animate-pulse" style={{ color: '#facc15' }} />
    } else if (step.includes('analy') || step.includes('Analy')) {
      return <Activity className="h-4 w-4 animate-pulse" style={{ color: '#facc15' }} />
    } else if (step.includes('report') || step.includes('Report') || step.includes('writ')) {
      return <FileText className="h-4 w-4 animate-pulse" style={{ color: '#facc15' }} />
    } else {
      return <Search className="h-4 w-4 animate-pulse" style={{ color: '#facc15' }} />
    }
  }

  const CompanyColumn = ({ 
    companyState, 
    onSearch, 
    title, 
    placeholder 
  }: { 
    companyState: CompanyAnalysisState
    onSearch: (opts: { company: string; url?: string; section: string }) => void
    title: string
    placeholder: string
  }) => (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card 
        className="border shadow-xl"
        style={{
          backgroundColor: '#1a1a1a !important',
          borderColor: '#262626 !important',
          borderRadius: '12px',
          boxShadow: '0 0 12px rgba(0,0,0,0.6)',
          border: '1px solid #262626'
        }}
      >
        <CardHeader>
          <CardTitle 
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#f9f9f9 !important'
            }}
          >
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CompanySearchCard onAnalyze={onSearch} placeholder={placeholder} />
        </CardContent>
      </Card>

      {/* Progress */}
      {companyState.isAnalyzing && (
        <Card 
          className="border shadow-lg"
          style={{
            backgroundColor: '#1a1a1a !important',
            borderColor: '#262626 !important',
            borderRadius: '12px',
            border: '1px solid #262626'
          }}
        >
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStepIcon(companyState.currentStep)}
                  <span 
                    className="font-medium text-sm"
                    style={{ color: '#f9f9f9 !important' }}
                  >
                    {companyState.currentStep}
                  </span>
                </div>
                <Badge 
                  variant="outline" 
                  style={{
                    backgroundColor: '#facc1520 !important',
                    color: '#facc15 !important',
                    borderColor: '#facc15 !important',
                    borderRadius: '6px',
                    border: '1px solid #facc15'
                  }}
                >
                  {companyState.progress}%
                </Badge>
              </div>
              <Progress value={companyState.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {companyState.error && (
        <Alert 
          className="border"
          style={{
            backgroundColor: '#1a0a0a !important',
            borderColor: '#ef4444 !important',
            borderRadius: '12px',
            border: '1px solid #ef4444'
          }}
        >
          <AlertCircle className="h-4 w-4" style={{ color: '#ef4444' }} />
          <AlertDescription style={{ color: '#ef4444 !important' }}>
            {companyState.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {companyState.result && (
        <div className="space-y-6">
          {/* Metrics */}
          <Card 
            className="border shadow-xl"
            style={{
              backgroundColor: '#1a1a1a !important',
              borderColor: '#262626 !important',
              borderRadius: '12px',
              border: '1px solid #262626'
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#f9f9f9 !important'
                }}
              >
                <CheckCircle className="h-5 w-5" style={{ color: '#22c55e' }} />
                <span>{companyState.result.competitor}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyState.result.metrics && (
                <CompetitiveDashboard 
                  data={{
                    competitor: companyState.result.competitor,
                    competitive_metrics: companyState.result.metrics.competitive_metrics,
                    swot_scores: companyState.result.metrics.swot_scores
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Executive Report */}
          <Card 
            className="border shadow-xl"
            style={{
              backgroundColor: '#1a1a1a !important',
              borderColor: '#262626 !important',
              borderRadius: '12px',
              border: '1px solid #262626'
            }}
          >
            <CardHeader>
              <CardTitle 
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#f9f9f9 !important'
                }}
              >
                📝 Executive Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="p-4 rounded-lg max-h-96 overflow-y-auto"
                style={{
                  backgroundColor: '#111111 !important',
                  borderRadius: '8px'
                }}
              >
                <MarkdownRenderer content={companyState.result.final_report} />
              </div>
            </CardContent>
          </Card>

          {/* Expandable Sections */}
          <details className="group">
            <summary 
              className="cursor-pointer font-medium hover:text-gray-300 flex items-center transition-colors duration-200"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#f9f9f9 !important'
              }}
            >
              <Brain className="h-4 w-4 mr-2" style={{ color: '#facc15' }} />
              Research Findings
            </summary>
            <Card 
              className="mt-2 border"
              style={{
                backgroundColor: '#1a1a1a !important',
                borderColor: '#262626 !important',
                borderRadius: '8px',
                border: '1px solid #262626'
              }}
            >
              <CardContent className="pt-4">
                <div 
                  className="p-4 rounded-lg max-h-60 overflow-y-auto"
                  style={{
                    backgroundColor: '#111111 !important',
                    borderRadius: '6px'
                  }}
                >
                  <MarkdownRenderer content={companyState.result.research_findings} />
                </div>
              </CardContent>
            </Card>
          </details>

          <details className="group">
            <summary 
              className="cursor-pointer font-medium hover:text-gray-300 flex items-center transition-colors duration-200"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#f9f9f9 !important'
              }}
            >
              <Activity className="h-4 w-4 mr-2" style={{ color: '#facc15' }} />
              Strategic Analysis
            </summary>
            <Card 
              className="mt-2 border"
              style={{
                backgroundColor: '#1a1a1a !important',
                borderColor: '#262626 !important',
                borderRadius: '8px',
                border: '1px solid #262626'
              }}
            >
              <CardContent className="pt-4">
                <div 
                  className="p-4 rounded-lg max-h-60 overflow-y-auto"
                  style={{
                    backgroundColor: '#111111 !important',
                    borderRadius: '6px'
                  }}
                >
                  <MarkdownRenderer content={companyState.result.strategic_analysis} />
                </div>
              </CardContent>
            </Card>
          </details>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Global dark theme override */}
      <style>{`
        body {
          background-color: #0a0a0a !important;
          color: #f9f9f9 !important;
        }
        html {
          background-color: #0a0a0a !important;
        }
      `}</style>
      
      <div 
        className="min-h-screen w-full dark"
        style={{ 
          backgroundColor: '#0a0a0a !important',
          fontFamily: 'Inter, sans-serif',
          color: '#f9f9f9 !important',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          '--background': '#0a0a0a',
          '--foreground': '#f9f9f9',
          '--card': '#1a1a1a',
          '--card-foreground': '#f9f9f9',
          '--border': '#262626',
          '--accent': '#facc15',
          '--accent-foreground': '#0a0a0a',
          '--muted': '#111111',
          '--muted-foreground': '#a1a1aa'
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="w-full border-b" style={{ borderColor: '#262626', backgroundColor: '#0a0a0a' }}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="transition-colors duration-200"
                style={{
                  color: '#a1a1aa',
                  backgroundColor: 'transparent'
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <h1 
                className="font-bold text-center"
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#f9f9f9'
                }}
              >
                Company Comparison
              </h1>
              
              <div></div>
            </div>
          </div>
        </div>

        {/* Main Content - Side by Side Comparison */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company 1 Column */}
            <CompanyColumn
              companyState={company1}
              onSearch={handleSearch1}
              title="🏢 Company 1"
              placeholder="Enter first company name..."
            />

            {/* Company 2 Column */}
            <CompanyColumn
              companyState={company2}
              onSearch={handleSearch2}
              title="🏢 Company 2"
              placeholder="Enter second company name..."
            />
          </div>
        </div>

        {/* Shared Chatbot at Bottom */}
        {(company1.result || company2.result) && (
          <div className="border-t" style={{ borderColor: '#262626', backgroundColor: '#0a0a0a' }}>
            <div className="max-w-7xl mx-auto p-6">
              <Card 
                className="border shadow-xl"
                style={{
                  backgroundColor: '#1a1a1a !important',
                  borderColor: '#262626 !important',
                  borderRadius: '12px',
                  boxShadow: '0 0 12px rgba(0,0,0,0.6)',
                  border: '1px solid #262626'
                }}
              >
                <CardHeader>
                  <CardTitle 
                    className="flex items-center space-x-2"
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#f9f9f9 !important'
                    }}
                  >
                    <MessageSquare className="h-5 w-5" style={{ color: '#facc15' }} />
                    <span>
                      Ask Questions About {[company1.result?.competitor, company2.result?.competitor].filter(Boolean).join(' vs ')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Chat Messages */}
                  {chatMessages.length > 0 && (
                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                      {chatMessages.map((msg, index) => (
                        <div 
                          key={index}
                          className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              msg.type === 'user' 
                                ? 'text-right' 
                                : 'text-left'
                            }`}
                            style={{
                              backgroundColor: msg.type === 'user' ? '#facc15' : '#111111',
                              color: msg.type === 'user' ? '#0a0a0a' : '#f9f9f9',
                              borderRadius: '12px'
                            }}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Chat Input */}
                  <div className="flex space-x-4">
                    <Input
                      placeholder="Compare strategies, ask about competitive positioning, market advantages..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                      disabled={isChatLoading}
                      style={{
                        backgroundColor: '#111111 !important',
                        borderColor: '#262626 !important',
                        borderRadius: '6px',
                        color: '#f9f9f9 !important',
                        fontSize: '14px',
                        border: '1px solid #262626'
                      }}
                    />
                    <Button
                      onClick={handleChatMessage}
                      disabled={!chatInput.trim() || isChatLoading}
                      style={{
                        backgroundColor: '#facc15 !important',
                        color: '#0a0a0a !important',
                        borderRadius: '6px',
                        fontWeight: 600,
                        border: 'none'
                      }}
                    >
                      {isChatLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  )
}