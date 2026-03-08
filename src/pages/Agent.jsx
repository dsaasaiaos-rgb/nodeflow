import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Plus, Database, BarChart2, Bot } from 'lucide-react';
import MessageBubble from '@/components/agent/MessageBubble';

export default function AgentPage() {
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        base44.auth.me().then(u => {
            if (!u) { base44.auth.redirectToLogin(); return; }
            setUser(u);
            loadConversations();
        });
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (!activeConversation) return;
        const unsub = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
            setMessages(data.messages || []);
        });
        return unsub;
    }, [activeConversation?.id]);

    const loadConversations = async () => {
        setLoadingConvs(true);
        const convs = await base44.agents.listConversations({ agent_name: 'integrations_agent' });
        setConversations(convs || []);
        setLoadingConvs(false);
    };

    const startNewConversation = async () => {
        const conv = await base44.agents.createConversation({
            agent_name: 'integrations_agent',
            metadata: { name: `Chat ${new Date().toLocaleDateString()}` }
        });
        setConversations(prev => [conv, ...prev]);
        setActiveConversation(conv);
        setMessages([]);
    };

    const openConversation = async (conv) => {
        const full = await base44.agents.getConversation(conv.id);
        setActiveConversation(full);
        setMessages(full.messages || []);
    };

    const sendMessage = async () => {
        if (!input.trim() || sending) return;
        let conv = activeConversation;
        if (!conv) {
            conv = await base44.agents.createConversation({
                agent_name: 'integrations_agent',
                metadata: { name: `Chat ${new Date().toLocaleDateString()}` }
            });
            setConversations(prev => [conv, ...prev]);
            setActiveConversation(conv);
        }
        const msg = input.trim();
        setInput('');
        setSending(true);
        await base44.agents.addMessage(conv, { role: 'user', content: msg });
        setSending(false);
    };

    const suggestedPrompts = [
        { icon: Database, text: 'List my Notion databases' },
        { icon: BarChart2, text: 'Run a BigQuery campaign report' },
        { icon: Database, text: 'Sync all nodes to Notion' },
    ];

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-800 flex flex-col bg-gray-900 shrink-0">
                <div className="p-4 border-b border-gray-800">
                    <Button onClick={startNewConversation} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                        <Plus className="w-4 h-4" /> New Chat
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {loadingConvs ? (
                        <div className="flex justify-center mt-6"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
                    ) : conversations.length === 0 ? (
                        <p className="text-gray-500 text-xs text-center mt-6">No conversations yet</p>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => openConversation(conv)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                                    activeConversation?.id === conv.id
                                        ? 'bg-indigo-600/30 text-indigo-300'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                            >
                                <p className="truncate font-medium">{conv.metadata?.name || 'Chat'}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{new Date(conv.created_date).toLocaleDateString()}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">Notion & BigQuery Assistant</h1>
                        <p className="text-xs text-gray-400">Sync nodes to Notion · Query marketing data</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {!activeConversation && (
                        <div className="flex flex-col items-center justify-center h-full gap-6">
                            <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                                <Bot className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-white mb-1">Notion & BigQuery Assistant</h2>
                                <p className="text-gray-400 text-sm">Sync your nodes to Notion or pull campaign reports from BigQuery</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
                                {suggestedPrompts.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(p.text)}
                                        className="flex items-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-left"
                                    >
                                        <p.icon className="w-4 h-4 text-indigo-400 shrink-0" />
                                        {p.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <MessageBubble key={i} message={msg} />
                    ))}
                    {sending && (
                        <div className="flex gap-3 justify-start">
                            <div className="h-7 w-7 rounded-lg bg-indigo-600/20 flex items-center justify-center mt-0.5">
                                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                            </div>
                            <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2.5">
                                <p className="text-sm text-gray-400">Thinking...</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-800">
                    <div className="flex gap-3 max-w-4xl mx-auto">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder="Ask about Notion or BigQuery..."
                            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <Button onClick={sendMessage} disabled={!input.trim() || sending} className="bg-indigo-600 hover:bg-indigo-700 px-4">
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}