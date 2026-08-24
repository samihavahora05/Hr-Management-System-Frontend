'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Sparkles, Send, CheckCircle2, AlertTriangle, User, Bot, Clock } from '@/components/ui/Icon';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data?: any;
  action?: {
    type: string;
    label: string;
    confirmation_prompt: string;
  } | null;
  timestamp: string;
}

interface AssistantChatProps {
  portalScope: 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee';
}

export function AssistantChat({ portalScope }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Action confirmation state
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    label: string;
    confirmation_prompt: string;
  } | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const defaultTitles: Record<string, string> = {
    admin: 'Organization AI Assistant',
    hr: 'HR Operations Assistant',
    manager: 'Team Management Assistant',
    team_leader: 'Team Management Assistant',
    employee: 'Employee Personal Assistant',
  };

  useEffect(() => {
    // Initial welcome message
    const welcomeText =
      portalScope === 'admin'
        ? "Hello Administrator! I am your Organization AI Assistant. Ask me about workforce headcount, department distribution, attendance trends, recruitment metrics, pending approvals, or recent audit logs."
        : portalScope === 'hr'
        ? "Hello! I am your HR Operations Assistant. I can help you with active workforce metrics, recruitment pipelines, leave queues, and attendance oversight."
        : portalScope === 'manager' || portalScope === 'team_leader'
        ? "Hello! I am your Team Management Assistant. Ask me about your team's attendance status, pending leave reviews, and performance."
        : "Hello! I am your Personal HR Assistant. Ask me about your leave balances, today's attendance status, or company policies.";

    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Initial suggestions based on role
    if (portalScope === 'admin') {
      setSuggestedQueries([
        'How many employees are currently active?',
        'How many employees are in each department?',
        'Show pending approvals.',
        'Show attendance trends and on-time rate.',
        'How many candidates are currently in recruitment?',
        'Show recent organization activity.',
      ]);
    } else if (portalScope === 'hr') {
      setSuggestedQueries([
        'How many active employees are in the organization?',
        'Show pending leave requests.',
        'Show recruitment candidate funnel.',
        'Who joined recently?',
      ]);
    } else if (portalScope === 'manager' || portalScope === 'team_leader') {
      setSuggestedQueries([
        'Show my team headcount.',
        'Show my team pending leave requests.',
        'How many team members clocked in today?',
      ]);
    } else {
      setSuggestedQueries([
        'Show my today attendance status.',
        'How many leave requests do I have pending?',
        'Show my department and designation.',
      ]);
    }
  }, [portalScope]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendQuery = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetchApi('/assistant/ask', {
        method: 'POST',
        body: JSON.stringify({ query: q }),
      });

      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.answer || 'I could not process your query at this time.',
        data: res.data,
        action: res.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (res.suggested_queries && Array.isArray(res.suggested_queries)) {
        setSuggestedQueries(res.suggested_queries);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: err.message || 'An error occurred while communicating with the assistant.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteConfirmedAction = async () => {
    if (!pendingAction) return;

    setExecutingAction(true);
    try {
      const res = await fetchApi('/assistant/execute', {
        method: 'POST',
        body: JSON.stringify({ action_type: pendingAction.type }),
      });

      setToastMessage(res.message || 'Action executed successfully');
      setIsConfirmModalOpen(false);
      setPendingAction(null);

      // Add feedback message in chat
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'assistant',
          text: `Action Completed: ${res.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to execute action');
    } finally {
      setExecutingAction(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f365e] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">{defaultTitles[portalScope] || 'HRMS AI Assistant'}</h2>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Role-Aware • Organization Scoped • Live Analytics</span>
            </p>
          </div>
        </div>
      </div>

      {/* CHAT MESSAGES SCROLL AREA */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-2xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-[#0f365e] text-white'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`rounded-2xl px-4 py-3 shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-xs'
                  : 'bg-slate-50 text-slate-900 border border-slate-200/80 rounded-tl-xs'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed font-medium">
                {msg.text.split('\n').map((line, lineIdx) => {
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  return (
                    <div key={lineIdx} className={line.startsWith('•') ? 'pl-2 my-0.5' : 'my-0.5'}>
                      {parts.map((part, partIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <strong key={partIdx} className="font-extrabold text-slate-900">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        return <span key={partIdx}>{part}</span>;
                      })}
                    </div>
                  );
                })}
              </div>

              {/* ACTION CONFIRMATION PROMPT IF PRESENT */}
              {msg.action && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setPendingAction(msg.action || null);
                      setIsConfirmModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{msg.action.label}</span>
                  </button>
                </div>
              )}

              <span
                className={`text-[9px] block mt-1.5 ${
                  msg.sender === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 mr-auto max-w-md">
            <div className="w-8 h-8 rounded-full bg-[#0f365e] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 text-slate-500 font-semibold flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing organization metrics...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTIONS PILLS */}
      {suggestedQueries.length > 0 && (
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0 text-[10px]">Suggested:</span>
          {suggestedQueries.slice(0, 4).map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSendQuery(sq)}
              className="px-3 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-full font-semibold text-slate-700 shrink-0 transition-colors cursor-pointer shadow-2xs"
            >
              {sq}
            </button>
          ))}
        </div>
      )}

      {/* INPUT FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery();
        }}
        className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask ${defaultTitles[portalScope] || 'Assistant'} anything...`}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f365e]"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="px-5 py-2.5 bg-[#0f365e] hover:bg-[#164677] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* ACTION CONFIRMATION MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          if (!executingAction) setIsConfirmModalOpen(false);
        }}
        title="Confirm Organization Action"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 font-medium">
              <p className="font-bold text-amber-950 mb-1">Administrative Confirmation Required</p>
              <p>{pendingAction?.confirmation_prompt}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={executingAction}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteConfirmedAction}
              disabled={executingAction}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {executingAction ? 'Executing Action...' : 'Confirm & Proceed'}
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </div>
  );
}
