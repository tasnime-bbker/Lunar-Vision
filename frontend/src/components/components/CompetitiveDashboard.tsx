import React from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";

interface CompetitiveMetrics {
  threat_level?: number;
  market_position?: number;
  innovation?: number;
  financial_strength?: number;
  brand_recognition?: number;
}

interface SwotScores {
  strengths?: number;
  weaknesses?: number;
  opportunities?: number;
  threats?: number;
}

interface DashboardData {
  competitor: string;
  competitive_metrics?: CompetitiveMetrics;
  swot_scores?: SwotScores;
}

interface CompetitiveDashboardProps {
  data: DashboardData;
}

const COLORS = {
  primary: "#3B82F6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  indigo: "#6366F1",
  pink: "#EC4899",
  gray: "#6B7280",
};

export default function CompetitiveDashboard({
  data,
}: CompetitiveDashboardProps) {
  const { competitor, competitive_metrics, swot_scores } = data;

  // Prepare data for different chart types
  const radarData = competitive_metrics
    ? [
        {
          metric: "Market Position",
          value: competitive_metrics.market_position || 0,
          max: 10,
        },
        {
          metric: "Innovation",
          value: competitive_metrics.innovation || 0,
          max: 10,
        },
        {
          metric: "Financial Strength",
          value: competitive_metrics.financial_strength || 0,
          max: 10,
        },
        {
          metric: "Brand Recognition",
          value: competitive_metrics.brand_recognition || 0,
          max: 10,
        },
      ]
    : [];

  const swotData = swot_scores
    ? [
        {
          name: "Strengths",
          value: swot_scores.strengths || 0,
          color: COLORS.success,
        },
        {
          name: "Weaknesses",
          value: swot_scores.weaknesses || 0,
          color: COLORS.danger,
        },
        {
          name: "Opportunities",
          value: swot_scores.opportunities || 0,
          color: COLORS.primary,
        },
        {
          name: "Threats",
          value: swot_scores.threats || 0,
          color: COLORS.warning,
        },
      ]
    : [];

  const competitiveOverview = competitive_metrics
    ? [
        {
          name: "Market Position",
          value: competitive_metrics.market_position || 0,
          fill: COLORS.primary,
        },
        {
          name: "Innovation",
          value: competitive_metrics.innovation || 0,
          fill: COLORS.purple,
        },
        {
          name: "Financial Strength",
          value: competitive_metrics.financial_strength || 0,
          fill: COLORS.success,
        },
        {
          name: "Brand Recognition",
          value: competitive_metrics.brand_recognition || 0,
          fill: COLORS.indigo,
        },
      ]
    : [];

  const threatLevel = competitive_metrics?.threat_level || 0;
  const getThreatColor = (level: number) => {
    if (level <= 2) return COLORS.success;
    if (level <= 3) return COLORS.warning;
    return COLORS.danger;
  };

  const getThreatLabel = (level: number) => {
    if (level <= 2) return "Low Threat";
    if (level <= 3) return "Medium Threat";
    return "High Threat";
  };

  // Custom tooltip component for dark theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-3 border rounded-lg shadow-lg"
          style={{
            backgroundColor: '#1a1a1a',
            borderColor: '#262626',
            color: '#f9f9f9'
          }}
        >
          <p className="font-medium">{`${label}: ${payload[0].value}/10`}</p>
        </div>
      );
    }
    return null;
  };

  if (!competitive_metrics && !swot_scores) {
    return (
      <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#262626' }}>
        <CardContent className="p-6">
          <div className="text-center" style={{ color: '#9CA3AF' }}>
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No metrics available for visualization</p>
            <p className="text-sm mt-2">
              Run an analysis to see competitive intelligence charts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{
              color: "#f9f9f9",
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
            }}
          >
            Competitive Intelligence Dashboard
          </h2>
          <p
            style={{
              color: "#a1a1aa",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Analysis for {competitor}
          </p>
        </div>
        {competitive_metrics?.threat_level && (
          <Badge
            variant="outline"
            className={`text-white border-0 px-4 py-2`}
            style={{ backgroundColor: getThreatColor(threatLevel) }}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {getThreatLabel(threatLevel)} ({threatLevel}/5)
          </Badge>
        )}
      </div>

      {/* Key Metrics Grid */}
      {competitive_metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm"
                    style={{
                      color: "#a1a1aa",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Market Position
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: "#f9f9f9",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {competitive_metrics.market_position || 0}/10
                  </p>
                </div>
                <Target className="h-8 w-8" style={{ color: "#facc15" }} />
              </div>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm"
                    style={{
                      color: "#a1a1aa",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Innovation Score
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: "#f9f9f9",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {competitive_metrics.innovation || 0}/10
                  </p>
                </div>
                <TrendingUp className="h-8 w-8" style={{ color: "#facc15" }} />
              </div>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm"
                    style={{
                      color: "#a1a1aa",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Financial Strength
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: "#f9f9f9",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {competitive_metrics.financial_strength || 0}/10
                  </p>
                </div>
                <Shield className="h-8 w-8" style={{ color: "#facc15" }} />
              </div>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm"
                    style={{
                      color: "#a1a1aa",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Brand Recognition
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: "#f9f9f9",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {competitive_metrics.brand_recognition || 0}/10
                  </p>
                </div>
                <Activity className="h-8 w-8" style={{ color: "#facc15" }} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitive Metrics Bar Chart */}
        {competitiveOverview.length > 0 && (
          <Card
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "12px",
            }}
          >
            <CardHeader>
              <CardTitle
                className="flex items-center"
                style={{
                  color: "#f9f9f9",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                <BarChart3
                  className="h-5 w-5 mr-2"
                  style={{ color: "#facc15" }}
                />
                Competitive Metrics Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={competitiveOverview}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#a1a1aa" }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    axisLine={{ stroke: "#262626" }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 12, fill: "#a1a1aa" }}
                    axisLine={{ stroke: "#262626" }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                      color: "#f9f9f9",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#facc15" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* SWOT Analysis Pie Chart */}
        {swotData.length > 0 && (
          <Card
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "12px",
            }}
          >
            <CardHeader>
              <CardTitle
                className="flex items-center"
                style={{
                  color: "#f9f9f9",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                <PieChartIcon
                  className="h-5 w-5 mr-2"
                  style={{ color: "#facc15" }}
                />
                SWOT Analysis Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={swotData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                    style={{ fill: '#f9f9f9' }}
                  >
                    {swotData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ color: '#f9f9f9' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Threat Level Gauge */}
        {competitive_metrics?.threat_level && (
          <Card
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "12px",
            }}
          >
            <CardHeader>
              <CardTitle
                className="flex items-center"
                style={{
                  color: "#f9f9f9",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                <AlertTriangle
                  className="h-5 w-5 mr-2"
                  style={{ color: "#facc15" }}
                />
                Competitive Threat Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  data={[
                    {
                      value: (threatLevel / 5) * 100,
                      fill: getThreatColor(threatLevel),
                    },
                  ]}
                >
                  <RadialBar dataKey="value" cornerRadius={30} />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-2xl font-bold"
                    style={{
                      color: "#f9f9f9",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {threatLevel}/5
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center mt-4">
                <Badge
                  variant="outline"
                  className="text-white border-0"
                  style={{ backgroundColor: getThreatColor(threatLevel) }}
                >
                  {getThreatLabel(threatLevel)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SWOT Scores Bar Chart */}
        {swotData.length > 0 && (
          <Card
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "12px",
            }}
          >
            <CardHeader>
              <CardTitle
                className="flex items-center"
                style={{
                  color: "#f9f9f9",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                <Activity
                  className="h-5 w-5 mr-2"
                  style={{ color: "#facc15" }}
                />
                SWOT Scores Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={swotData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    type="number"
                    domain={[0, 10]}
                    tick={{ fontSize: 12, fill: "#a1a1aa" }}
                    axisLine={{ stroke: "#262626" }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12, fill: "#a1a1aa" }}
                    axisLine={{ stroke: "#262626" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                      color: "#f9f9f9",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {swotData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}