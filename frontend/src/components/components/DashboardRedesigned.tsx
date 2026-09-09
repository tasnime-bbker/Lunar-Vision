import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from './ui/form'
import { 
  Search, 
  Globe, 
  Building, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Brain,
  FileText,
  Loader2,
  ArrowLeft,
  GitCompare,
  Send,
  MessageSquare
} from 'lucide-react'
import DemoScenarios from './DemoScenarios'
import MarkdownRenderer from './MarkdownRenderer'
import CompetitiveDashboard from './CompetitiveDashboard'
import CompanySearchCard from './CompanySearchCard'
import AnalysisModeToggle, { type AnalysisMode } from './AnalysisModeToggle'

// Form validation schema
const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(100, "Company name too long"),
  companyUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

interface StreamEvent {
  timestamp: string
  type: string
  step?: string
  message?: string
  tool_name?: string
  tool_input?: any
  data?: any
}

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

const API_BASE_URL = 'http://localhost:8000' // Enhanced API with modes

interface DashboardProps {
  company: string
  jobId?: string
  analysisMode?: AnalysisMode
  onBack?: () => void
  onCompare?: () => void
}

export default function DashboardRedesigned({ company, onBack, onCompare, analysisMode: initialAnalysisMode }: DashboardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'bot', message: string}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(initialAnalysisMode || 'simple')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: company,
      companyUrl: '',
    },
  })

  // Auto-submit when company is provided
  useEffect(() => {
    if (company && !isAnalyzing && !analysisResult) {
      setTimeout(() => {
        analyzeCompetitor({
          companyName: company,
          companyUrl: '',
        })
      }, 100)
    }
  }, [company, isAnalyzing, analysisResult])

  // Handle new search from top search bar
  const handleNewSearch = (opts: { company: string; url?: string; section: string }) => {
    // Reset state and start new analysis
    setAnalysisResult(null)
    setError(null)
    setProgress(0)
    setCurrentStep('')
    setChatMessages([])
    
    // Update form and start analysis
    form.setValue('companyName', opts.company)
    form.setValue('companyUrl', opts.url || '')
    
    analyzeCompetitor({
      companyName: opts.company,
      companyUrl: opts.url || '',
    })
  }

  // Handle chat message - simplified without RAG (feature removed)
  const handleChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }])
    
    // RAG feature removed - provide helpful fallback
    setChatMessages(prev => [...prev, { 
      type: 'bot', 
      message: 'Chat feature is currently unavailable. Please refer to the analysis results above for insights about this competitor.' 
    }])
  }

  const analyzeCompetitor = async (values: FormValues) => {
    setIsAnalyzing(true)
    setProgress(0)
    setCurrentStep('Starting analysis...')
    setError(null)

    try {
      // Send the POST request to start streaming analysis
      const response = await fetch(`${API_BASE_URL}/analyze/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          competitor_name: values.companyName,
          competitor_website: values.companyUrl || undefined,
          niche: analysisMode === 'deep' ? 'all' : 'all', // Map to niche parameter
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // The response is a streaming response, handle it
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
              handleStreamEvent(data)
            } catch (e) {
              console.error('Error parsing stream data:', e)
            }
          }
        }
      }

    } catch (error) {
      console.error('Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleStreamEvent = (event: StreamEvent) => {
    console.log('Stream event:', event)

    switch (event.type) {
      case 'session_start':
        setCurrentStep('Initializing analysis...')
        setProgress(5)
        break
      case 'status_update':
        if (event.message) {
          setCurrentStep(event.message)
          // Update progress based on step
          if (event.step === 'research_start') setProgress(20)
          else if (event.step === 'research_complete') setProgress(40)
          else if (event.step === 'analysis_start') setProgress(60)
          else if (event.step === 'analysis_complete') setProgress(80)
          else if (event.step === 'report_start') setProgress(90)
        }
        break
      case 'tool_call':
        if (event.tool_name) {
          setCurrentStep(`Using ${event.tool_name}...`)
        }
        break
      case 'complete':
        if (event.data) {
          setAnalysisResult(event.data)
          setProgress(100)
          setCurrentStep('Analysis complete!')
        }
        break
      case 'error':
        setError(event.message || 'An error occurred during analysis')
        break
    }
  }

  const handleDemoScenario = (scenario: { name: string; website: string }) => {
    form.setValue('companyName', scenario.name)
    form.setValue('companyUrl', scenario.website)
    analyzeCompetitor({
      companyName: scenario.name,
      companyUrl: scenario.website
    })
  }

  const onSubmit = (values: FormValues) => {
    analyzeCompetitor(values)
  }

  const resetForm = () => {
    setAnalysisResult(null)
    setError(null)
    setProgress(0)
    setCurrentStep('')
    setChatMessages([])
    form.reset()
  }

  const getStepIcon = (step: string) => {
    if (step.includes('research') || step.includes('Research')) {
      return <Brain className="h-4 w-4 animate-pulse" style={{ color: '#facc15' }} />
    } else if (step.includes('analy') || step.includes('Analy')) {
      return <Activity className="h-4 w-4 animate-pulse" style={{ color: '#facc15' }} />
    } else if (step.includes('report') || step.includes('Report') || step.includes('writ')) {
      return <FileText className="h-4 w-4 animate-pulse" style={{ color: '#facc15' }} />
    } else {
      return <Zap className="h-4 w-4 animate-pulse" style={{ color: '#facc15' }} />
    }
  }

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
        {/* Header with Navigation and Search */}
        <div className="w-full border-b" style={{ borderColor: '#262626', backgroundColor: '#0a0a0a' }}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {onBack && (
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
                    Back to Search
                  </Button>
                )}
                {onCompare && (
                  <Button
                    onClick={onCompare}
                    variant="ghost"
                    size="sm"
                    className="transition-colors duration-200"
                    style={{
                      color: '#a1a1aa',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <GitCompare className="w-4 h-4 mr-2" />
                    Compare Company
                  </Button>
                )}
              </div>
              <h1 
                className="font-bold text-center"
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#f9f9f9'
                }}
              >
                Competitive Intelligence Dashboard
              </h1>
              <div></div>
            </div>
            
            {/* Analysis Mode Toggle */}
            <div className="max-w-4xl mx-auto mb-4 flex justify-center">
              <AnalysisModeToggle 
                mode={analysisMode} 
                onChange={setAnalysisMode}
              />
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <CompanySearchCard onAnalyze={handleNewSearch} />
            </div>
          </div>
        </div>

        {/* Main Content - Much Wider Layout */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Progress and Status */}
          {isAnalyzing && (
            <Card 
              className="border shadow-lg mb-6"
              style={{
                backgroundColor: '#1a1a1a !important',
                borderColor: '#262626 !important',
                borderRadius: '12px',
                boxShadow: '0 0 12px rgba(0,0,0,0.6)',
                border: '1px solid #262626'
              }}
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStepIcon(currentStep)}
                      <span 
                        className="font-medium"
                        style={{
                          fontSize: '16px',
                          color: '#f9f9f9 !important'
                        }}
                      >
                        {currentStep}
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
                      {progress}%
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert 
              className="border mb-6"
              style={{
                backgroundColor: '#1a0a0a !important',
                borderColor: '#ef4444 !important',
                borderRadius: '12px',
                border: '1px solid #ef4444'
              }}
            >
              <AlertCircle className="h-4 w-4" style={{ color: '#ef4444' }} />
              <AlertDescription style={{ color: '#ef4444 !important' }}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Results - Two Column Layout: Graphs Left, Text Right */}
          {analysisResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Graphs and Visualizations */}
              <div className="space-y-6">
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
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#f9f9f9 !important'
                      }}
                    >
                      📊 Competitive Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.metrics && (
                      <CompetitiveDashboard 
                        data={{
                          competitor: analysisResult.competitor,
                          competitive_metrics: analysisResult.metrics.competitive_metrics,
                          swot_scores: analysisResult.metrics.swot_scores
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Text and Information */}
              <div className="space-y-6">
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
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#f9f9f9 !important'
                      }}
                    >
                      <CheckCircle className="h-6 w-6" style={{ color: '#22c55e' }} />
                      <span>Analysis Complete: {analysisResult.competitor}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 
                        className="font-semibold mb-4"
                        style={{
                          fontSize: '18px',
                          fontWeight: 700,
                          color: '#f9f9f9 !important'
                        }}
                      >
                        📝 Executive Report
                      </h3>
                      <div 
                        className="p-6 rounded-lg"
                        style={{
                          backgroundColor: '#111111 !important',
                          borderRadius: '12px'
                        }}
                      >
                        <MarkdownRenderer content={analysisResult.final_report} />
                      </div>
                    </div>

                    <details className="group">
                      <summary 
                        className="cursor-pointer font-medium hover:text-gray-300 flex items-center transition-colors duration-200"
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#f9f9f9 !important'
                        }}
                      >
                        <Brain className="h-4 w-4 mr-2" style={{ color: '#facc15' }} />
                        View Research Findings
                      </summary>
                      <div 
                        className="mt-2 p-6 rounded-lg"
                        style={{
                          backgroundColor: '#111111 !important',
                          borderRadius: '12px'
                        }}
                      >
                        <MarkdownRenderer content={analysisResult.research_findings} />
                      </div>
                    </details>

                    <details className="group">
                      <summary 
                        className="cursor-pointer font-medium hover:text-gray-300 flex items-center transition-colors duration-200"
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#f9f9f9 !important'
                        }}
                      >
                        <Activity className="h-4 w-4 mr-2" style={{ color: '#facc15' }} />
                        View Strategic Analysis
                      </summary>
                      <div 
                        className="mt-2 p-6 rounded-lg"
                        style={{
                          backgroundColor: '#111111 !important',
                          borderRadius: '12px'
                        }}
                      >
                        <MarkdownRenderer content={analysisResult.strategic_analysis} />
                      </div>
                    </details>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Chatbot at Bottom */}
        {analysisResult && (
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
                    <span>Ask Questions About {analysisResult.competitor}</span>
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
                      placeholder="Ask about competitive positioning, strengths, threats..."
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
