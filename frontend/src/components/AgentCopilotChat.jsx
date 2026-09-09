import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api';

const AGENT_PERSONAS = [
  {
    id: 'data_analysis_and_insights',
    name: 'Data & Insights Analyst',
    avatar: '📊',
    color: '#38bdf8',
    description: 'Diagnoses revenue drivers, customer cohort metrics, AOV drops, and retention bottlenecks.',
    starters: [
      'What are the primary drivers for e-commerce growth this quarter?',
      'How do we increase repeat purchase rate from 24% to 35%?',
      'What metrics indicate early signs of customer churn?',
      'How does delivery delay correlate with customer review scores?',
    ],
  },
  {
    id: 'content_creation_and_generation',
    name: 'Growth & Content Strategist',
    avatar: '✍️',
    color: '#818cf8',
    description: 'Creates multi-channel marketing campaigns, high-converting social copy, email win-back sequences, and ad concepts.',
    starters: [
      'Write a 3-part automated email win-back flow for churned customers',
      'Create an Instagram carousel concept promoting our top category',
      'Draft a high-converting Google Search ad copy for summer essentials',
      'Generate a LinkedIn thought-leadership post on modern e-commerce logistics',
    ],
  },
  {
    id: 'customer_service_and_engagement',
    name: 'Customer Experience Specialist',
    avatar: '🤝',
    color: '#34d399',
    description: 'Designs proactive satisfaction flows, VIP loyalty programs, and resolution scripts for delivery delays.',
    starters: [
      'Design a proactive apology flow for orders delayed past estimated delivery',
      'How should we structure a tiered VIP loyalty program?',
      'What are best practices for turning 1-star reviews into loyal advocates?',
      'Create an automated post-purchase survey that gets high completion rates',
    ],
  },
  {
    id: 'automation_of_complex_processes',
    name: 'Automation & Operations Agent',
    avatar: '⚙️',
    color: '#f59e0b',
    description: 'Automates inventory alerts, order sync workflows, CRM triggers, and CI/CD operations.',
    starters: [
      'How do we automate low-stock alerts before items stock out?',
      'What automated triggers should sync our e-commerce store with our email platform?',
      'Design an automated data reconciliation flow for multi-channel sales',
      'How can we set up continuous competitive price monitoring?',
    ],
  },
];

export function AgentCopilotChat() {
  const [activeAgentId, setActiveAgentId] = useState(AGENT_PERSONAS[0].id);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      agentId: AGENT_PERSONAS[0].id,
      content:
        'Hello! I am your **Data & Insights Analyst**. I can help you diagnose e-commerce performance, calculate unit economics, uncover hidden revenue leaks, and build data-driven growth strategies. How can I assist you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const activeAgent = AGENT_PERSONAS.find((a) => a.id === activeAgentId) || AGENT_PERSONAS[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg = {
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage({
        message: text,
        agentType: activeAgent.id,
        chatHistory: historyPayload,
        uploadedFiles: [],
      });

      const assistantMsg = {
        role: 'assistant',
        agentId: activeAgent.id,
        content: res.content || 'I have processed your request. Let me know if you need deeper details.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        agentId: activeAgent.id,
        content: `Apologies, I encountered an issue: ${err.message}. Please try again with a specific prompt.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAgent = (agent) => {
    setActiveAgentId(agent.id);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        agentId: agent.id,
        content: `Switched context to **${agent.name}** (${agent.avatar}). ${agent.description}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="copilot-chat-container">
      {/* Header Panel */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div className="section-heading">
          <span className="section-tag" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
            Multi-Agent Dialogue
          </span>
          <h2>Intelligent Growth & Strategy Copilot</h2>
        </div>
        <p style={{ color: 'var(--text-secondary, #94a3b8)', marginTop: '8px', maxWidth: '850px', fontSize: '15px' }}>
          Engage directly with our specialized agent fleet. Select an agent persona below to tune the expertise and response perspective.
        </p>

        {/* Persona Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '18px' }}>
          {AGENT_PERSONAS.map((persona) => {
            const isActive = persona.id === activeAgentId;
            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleSelectAgent(persona)}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: isActive ? `${persona.color}18` : 'rgba(15, 23, 42, 0.6)',
                  border: `1.5px solid ${isActive ? persona.color : 'rgba(255, 255, 255, 0.08)'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '20px' }}>{persona.avatar}</span>
                  <strong style={{ fontSize: '14px', color: isActive ? '#ffffff' : '#e2e8f0' }}>{persona.name}</strong>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                  {persona.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Chat Area Card */}
      <section
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '620px',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Chat Top Banner */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>{activeAgent.avatar}</span>
            <div>
              <strong style={{ fontSize: '15px', color: '#f8fafc' }}>{activeAgent.name}</strong>
              <div style={{ fontSize: '12px', color: activeAgent.color }}>● Active in session</div>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setMessages([])}
            style={{ padding: '4px 12px', fontSize: '12px' }}
          >
            Clear Conversation
          </button>
        </div>

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'rgba(10, 14, 26, 0.4)',
          }}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '14px 18px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isUser
                      ? 'linear-gradient(135deg, #4f46e5, #3b82f6)'
                      : 'rgba(20, 27, 45, 0.85)',
                    border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: isUser ? '#c7d2fe' : '#64748b', marginBottom: '4px' }}>
                    <span>{isUser ? 'You' : activeAgent.name}</span>
                    <span>{msg.time}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(20, 27, 45, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#94a3b8',
                  fontSize: '13px',
                }}
              >
                <span className="spinner-indicator" />
                {activeAgent.name} is formulating analysis...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Starter Chips */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {activeAgent.starters.map((starter, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(starter)}
              disabled={isLoading}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                color: '#cbd5e1',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              💡 {starter}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.85)' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '12px' }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask ${activeAgent.name} anything about data, strategy, marketing, or automation...`}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(10, 14, 26, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !inputMessage.trim()}
              style={{ padding: '12px 24px', fontWeight: '600' }}
            >
              Send
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
