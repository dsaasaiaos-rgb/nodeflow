import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import Sidebar from '../components/Sidebar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
    Save, Settings, Code, FileText, FileCode, AlertCircle, 
    MessageSquare, Send, Sparkles, Loader2, ExternalLink, Home
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';

export default function NodeViewPage() {
    const [user, setUser] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [node, setNode] = useState(null);
    const [editedNode, setEditedNode] = useState(null);
    const [messages, setMessages] = useState([]);
    const [docs, setDocs] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState('info');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (messagesEndRef.current && activeTab === 'info') {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const nodeId = urlParams.get('nodeId');

            const currentUser = await base44.auth.me();
            if (!currentUser) {
                base44.auth.redirectToLogin();
                return;
            }
            setUser(currentUser);

            const { data: { nodes: userNodes } } = await base44.functions.invoke("listMyNodes");
            setNodes(userNodes);

            const currentNode = userNodes.find(n => n.id === nodeId);
            if (currentNode) {
                setNode(currentNode);
                setEditedNode(currentNode);

                const { data } = await base44.functions.invoke('getNodeData', { nodeId });
                setMessages(data.messages);
                const docsMap = data.docs.reduce((acc, doc) => ({ ...acc, [doc.key]: doc.content }), {});
                setDocs(docsMap);
            }
        } catch (e) {
            console.error(e);
            base44.auth.redirectToLogin();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveNode = async () => {
        setIsSaving(true);
        try {
            await base44.functions.invoke('updateNode', { nodeId: node.id, updates: editedNode });
            setNode(editedNode);
        } catch (e) {
            alert("Error saving: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        
        try {
            const { data: { message } } = await base44.functions.invoke('postMessage', {
                nodeId: node.id,
                content: newMessage
            });
            setMessages([...messages, message]);
            setNewMessage('');
        } catch (e) {
            alert("Failed to send: " + e.message);
        }
    };

    const handleSaveDoc = async (key, content) => {
        try {
            await base44.functions.invoke('saveDoc', {
                nodeId: node.id,
                key,
                content
            });
            setDocs(prev => ({...prev, [key]: content}));
        } catch (e) {
            console.error("Failed to save doc", e);
        }
    };

    const handleMagicDraft = async () => {
        setAiLoading(true);
        const lastMessages = messages.slice(-5).map(m => `${m.userName}: ${m.body}`).join('\n');
        const prompt = `You are a helpful project manager responding to a client or team member. 
Read the following conversation context and draft a short, professional, friendly response for me (${user.full_name || user.email}).
Context:\n${lastMessages}\n\nDraft Response:`;
        
        try {
            const { data: { text } } = await base44.functions.invoke('generateGeminiResponse', { prompt });
            setNewMessage(text);
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(false);
        }
    };

    const handleAIPolish = async (key, currentContent) => {
        if (!currentContent) return;
        setAiLoading(true);
        const docTypes = {
            'sow': 'Statement of Work',
            'agreement': 'Service Agreement',
            'oosw': 'Out of Scope Work List',
            'siteCode': 'Technical Documentation'
        };
        const type = docTypes[key] || 'Document';
        
        const prompt = `You are a legal and technical expert. Rewrite the following text to be a professional, 
structured, and clear ${type}. Keep the original intent but improve the grammar, formatting, and tone.
Original Text:\n${currentContent}`;

        try {
            const { data: { text } } = await base44.functions.invoke('generateGeminiResponse', { prompt });
            await handleSaveDoc(key, text);
        } catch (e) {
            alert("AI Polish failed");
        } finally {
            setAiLoading(false);
        }
    };

    const handleNodeClick = (selectedNode) => {
        window.location.href = createPageUrl('NodeView') + '?nodeId=' + selectedNode.id;
    };

    const handleHubClick = () => {
        window.location.href = createPageUrl('Hub');
    };

    const hasChanges = JSON.stringify(node) !== JSON.stringify(editedNode);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!node) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Node not found</h2>
                    <Button onClick={handleHubClick}>Go to Hub</Button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'info', label: 'Overview', icon: Settings },
        { id: 'code', label: 'Site Code', icon: Code },
        { id: 'agreement', label: 'Agreement', icon: FileText },
        { id: 'sow', label: 'SOW', icon: FileCode },
        { id: 'oosw', label: 'OOSW', icon: AlertCircle },
    ];

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            <Sidebar 
                user={user}
                nodes={nodes}
                currentView="node"
                currentNode={node}
                onSelectHub={handleHubClick}
                onSelectNode={handleNodeClick}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">{editedNode?.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                editedNode?.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 
                                editedNode?.status === 'Completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                editedNode?.status === 'On Hold' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                                {editedNode?.status}
                            </span>
                        </div>
                        <a href={editedNode?.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mt-1">
                            {editedNode?.url} <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                    <Button
                        onClick={handleSaveNode}
                        disabled={!hasChanges || isSaving}
                        className={`${
                            hasChanges && !isSaving
                                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        } transition-all`}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Tabs */}
                        <div className="px-6 pt-4 border-b border-gray-200 bg-white">
                            <div className="flex gap-6 overflow-x-auto">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`pb-3 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
                                            activeTab === tab.id
                                                ? 'border-indigo-600 text-indigo-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            <div className="max-w-4xl mx-auto">
                                {activeTab === 'info' && editedNode && (
                                    <div className="space-y-6 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="col-span-1 md:col-span-2">
                                                <Label className="text-sm font-bold text-gray-700 mb-2">Project Name</Label>
                                                <Input
                                                    value={editedNode.name}
                                                    onChange={(e) => setEditedNode({ ...editedNode, name: e.target.value })}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                                <Label className="text-sm font-bold text-gray-700 mb-2">Description</Label>
                                                <Textarea
                                                    value={editedNode.description}
                                                    onChange={(e) => setEditedNode({ ...editedNode, description: e.target.value })}
                                                    className="mt-1"
                                                    rows="3"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-bold text-gray-700 mb-2">Site URL</Label>
                                                <Input
                                                    type="url"
                                                    value={editedNode.url}
                                                    onChange={(e) => setEditedNode({ ...editedNode, url: e.target.value })}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-bold text-gray-700 mb-2">Status</Label>
                                                <select
                                                    value={editedNode.status}
                                                    onChange={(e) => setEditedNode({ ...editedNode, status: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                                                >
                                                    <option>Active</option>
                                                    <option>In Progress</option>
                                                    <option>On Hold</option>
                                                    <option>Completed</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-6 border-t border-gray-100">
                                            <h3 className="text-sm font-bold text-gray-900 mb-3">Project Metadata</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                                                    <span className="text-gray-500 block mb-1">Created At</span>
                                                    <span className="font-bold font-mono">{new Date(editedNode.created_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                                                    <span className="text-gray-500 block mb-1">Node ID</span>
                                                    <span className="font-bold font-mono text-xs truncate block">{editedNode.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {['agreement', 'sow', 'oosw', 'code'].includes(activeTab) && (
                                    <div className="h-full flex flex-col bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-end mb-4">
                                            <Label className="text-lg font-bold text-gray-900 capitalize">
                                                {activeTab === 'code' ? 'Technical Implementation Notes' : 
                                                 activeTab === 'oosw' ? 'Out of Scope Work (Billable)' :
                                                 activeTab === 'sow' ? 'Statement of Work' : 'Service Agreement'}
                                            </Label>
                                            <Button
                                                onClick={() => handleAIPolish(activeTab === 'code' ? 'siteCode' : activeTab, docs[activeTab === 'code' ? 'siteCode' : activeTab])}
                                                disabled={aiLoading}
                                                variant="outline"
                                                className="text-xs flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-none hover:shadow-lg"
                                            >
                                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                Polish with AI
                                            </Button>
                                        </div>
                                        <Textarea
                                            key={activeTab}
                                            defaultValue={docs[activeTab === 'code' ? 'siteCode' : activeTab] || ''}
                                            onBlur={(e) => handleSaveDoc(activeTab === 'code' ? 'siteCode' : activeTab, e.target.value)}
                                            className={`flex-1 min-h-[600px] leading-relaxed ${
                                                activeTab === 'code' 
                                                    ? 'bg-slate-900 text-slate-50 font-mono text-sm' 
                                                    : activeTab === 'oosw' 
                                                        ? 'bg-yellow-50 border-yellow-200' 
                                                        : 'bg-white'
                                            }`}
                                            placeholder={activeTab === 'code' ? "// Technical notes..." : "Enter details here..."}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chat Sidebar */}
                    <div className="w-96 border-l border-gray-200 bg-white flex-col hidden lg:flex">
                        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                <MessageSquare className="w-5 h-5" />
                                Team Chat
                            </h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-400 mt-12 text-sm">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No messages yet</p>
                                    <p>Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-xs font-bold text-gray-700">{msg.userName}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(msg.created_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] shadow-sm ${
                                            msg.userId === user.id 
                                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none' 
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                        }`}>
                                            {msg.body}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-white">
                            <button 
                                onClick={handleMagicDraft}
                                disabled={aiLoading || messages.length === 0}
                                className="mb-3 text-xs flex items-center gap-1.5 text-purple-600 hover:text-purple-700 disabled:opacity-50 font-medium"
                            >
                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                Magic Draft
                            </button>
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1"
                                />
                                <Button 
                                    onClick={handleSend}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                    size="icon"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}