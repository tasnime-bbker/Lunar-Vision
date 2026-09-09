import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Building, Palette, MessageSquare } from 'lucide-react'

interface DemoScenario {
  id: number
  name: string
  website: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
}

const demoScenarios: DemoScenario[] = [
  {
    id: 1,
    name: "Nvidia",
    website: "https://nvidia.com",
    description: "Leading manufacturer of graphics processing units (GPUs) and AI computing platforms",
    category: "Hardware & Semiconductors",
    icon: Globe
  },
  {
    id: 2,
    name: "Notion",
    website: "https://notion.so",
    description: "All-in-one workspace",
    category: "Productivity",
    icon: Building
  },
  {
    id: 3,
    name: "Figma",
    website: "https://figma.com",
    description: "Collaborative design",
    category: "Design",
    icon: Palette
  },
  {
    id: 4,
    name: "Slack",
    website: "https://slack.com",
    description: "Enterprise communication",
    category: "Communication",
    icon: MessageSquare
  }
]

interface DemoScenariosProps {
  onSelectScenario: (name: string, website: string) => void
}

export default function DemoScenarios({ onSelectScenario }: DemoScenariosProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Try Demo Scenarios</CardTitle>
        <CardDescription>
          Click any scenario below to auto-fill the form and start analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoScenarios.map((scenario) => {
            const IconComponent = scenario.icon
            return (
              <div
                key={scenario.id}
                className="group border rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onSelectScenario(scenario.name, scenario.website)}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    <IconComponent className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-black transition-colors">
                        {scenario.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {scenario.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                    <p className="text-xs text-gray-400 truncate">{scenario.website}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Tip:</strong> These scenarios demonstrate different types of competitive analysis.
            Each will trigger our multi-agent workflow to research, analyze, and report on the selected company.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}