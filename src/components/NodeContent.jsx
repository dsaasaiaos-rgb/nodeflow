import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
    Save, Settings, Code, FileText, FileCode, AlertCircle, 
    MessageSquare, Send, Sparkles, Loader2, ExternalLink, Copy, Key, Users, X, Trash2, ShieldCheck
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import VersionHistoryModal from '@/components/modals/VersionHistoryModal';
import DocEditor from '@/components/NodeContent/DocEditor';
import MembersPanel from '@/components/NodeContent/MembersPanel';

export default function NodeContent({ user, node, onClose, onUpdate, onDelete }) {
    // Local state for the node content
    const [editedNode, setEditedNode] = useState(node);
    const [messages, setMessages] = useState([]);
    const [docs, setDocs] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState('info');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [summaries, setSummaries] = useState({});
    const [showSummary, setShowSummary] = useState({});
    const [inviteCodes, setInviteCodes] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [myRole, setMyRole] = useState(null);
    const [members, setMembers] = useState([]);
    const [creatingInvite, setCreatingInvite] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(null);
    const messagesEndRef = useRef(null);

    // Update local state when prop node changes
    useEffect(() => {
        setEditedNode(node);
    }, [node]);

    useEffect(() => {
        loadData();
    }, [node.id]);

    useEffect(() => {
        if (messagesEndRef.current && activeTab === 'info') {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const { data } = await base44.functions.invoke('getNodeData', { nodeId: node.id });
            if (data.node) {
                setEditedNode(data.node);
                if (onUpdate) onUpdate(data.node);
            }
            setMessages(data.messages);
            const docsMap = data.docs.reduce((acc, doc) => ({ ...acc, [doc.key]: doc.content }), {});
            setDocs(docsMap);
            setPermissions(data.permissions || {});
            setMyRole(data.myRole);
            if (data.inviteCodes) setInviteCodes(data.inviteCodes);
            if (data.members) setMembers(data.members);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveNode = async () => {
        setIsSaving(true);
        try {
            const { data } = await base44.functions.invoke('updateNode', { nodeId: node.id, updates: editedNode });
            if (data.error) throw new Error(data.error);
            setEditedNode(data.node);
            if (onUpdate) onUpdate(data.node);
        } catch (e) {
            console.error("Save error:", e);
            alert("Error saving: " + (e.message || "Unknown error occurred"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNode = async () => {
        if (!confirm("Are you sure you want to delete this node? This action cannot be undone and will remove all associated data.")) return;
        
        setIsSaving(true);
        try {
            const { data } = await base44.functions.invoke('deleteNode', { nodeId: node.id });
            if (data.error) throw new Error(data.error);
            if (onDelete) onDelete();
        } catch (e) {
            alert("Error deleting node: " + e.message);
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

    const handleSummarize = async (key, content) => {
        if (!content) {
            alert("No content to summarize");
            return;
        }
        setAiLoading(true);
        const docTypes = {
            'sow': 'Statement of Work',
            'agreement': 'Service Agreement',
            'oosw': 'Out of Scope Work List',
            'siteCode': 'Technical Documentation'
        };
        const type = docTypes[key] || 'Document';
        
        const prompt = `Provide a concise, clear summary of the following ${type}. Focus on key points, deliverables, timelines, and important terms. Format as bullet points.

Document:\n${content}`;

        try {
            const { data: { text } } = await base44.functions.invoke('generateGeminiResponse', { prompt });
            setSummaries(prev => ({...prev, [key]: text}));
            setShowSummary(prev => ({...prev, [key]: true}));
        } catch (e) {
            alert("AI Summarize failed");
        } finally {
            setAiLoading(false);
        }
    };

    const handleCreateInvite = async (roleToGrant) => {
        setCreatingInvite(true);
        try {
            const { data: { code } } = await base44.functions.invoke('createInvite', {
                nodeId: node.id,
                roleToGrant
            });
            setInviteCodes(prev => [...prev, { codeHash: code, roleToGrant, usesLeft: 1 }]);
        } catch (e) {
            alert("Failed to create invite: " + e.message);
        } finally {
            setCreatingInvite(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const hasChanges = JSON.stringify(node) !== JSON.stringify(editedNode);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const tabs = [
        { id: 'info', label: 'Overview', icon: Settings },
        { id: 'code', label: 'Site Code', icon: Code },
        { id: 'agreement', label: 'Agreement', icon: FileText },
        { id: 'sow', label: 'SOW', icon: FileCode },
        { id: 'oosw', label: 'OOSW', icon: AlertCircle },
        ...(permissions.canManageMembers ? [{ id: 'members', label: 'Members', icon: ShieldCheck }] : []),
    ];

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shadow-sm shrink-0">
                <div>
                    <div className="flex items-center gap-3">
                        {onClose && (
                            <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
                                <X className="w-5 h-5" />
                            </Button>
                        )}
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{editedNode?.name}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            editedNode?.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 
                            editedNode?.status === 'Completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            editedNode?.status === 'On Hold' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                            {editedNode?.status}
                        </span>
                    </div>
                    <a href={editedNode?.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-3 ml-12">
                        {editedNode?.url} <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <div className="flex items-center gap-2">
                    {myRole && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 capitalize">
                            {myRole}
                        </span>
                    )}
                    {permissions.canDelete && (
                        <Button
                            onClick={handleDeleteNode}
                            disabled={isSaving}
                            variant="destructive"
                            size="icon"
                            className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800"
                            title="Delete Node"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                    {permissions.canEditNode && (
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
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Tabs */}
                    <div className="px-6 pt-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                        <div className="flex gap-6 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-3 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
                                        activeTab === tab.id
                                            ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
                        <div className="max-w-4xl mx-auto">
                            {activeTab === 'info' && editedNode && (
                                <div className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-1 md:col-span-2">
                                            <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Project Name</Label>
                                            <Input
                                                value={editedNode.name}
                                                onChange={(e) => setEditedNode({ ...editedNode, name: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</Label>
                                            <Textarea
                                                value={editedNode.description}
                                                onChange={(e) => setEditedNode({ ...editedNode, description: e.target.value })}
                                                className="mt-1"
                                                rows="3"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Site URL</Label>
                                            <Input
                                                type="url"
                                                value={editedNode.url}
                                                onChange={(e) => setEditedNode({ ...editedNode, url: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Status</Label>
                                            <select
                                                value={editedNode.status}
                                                onChange={(e) => setEditedNode({ ...editedNode, status: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                                            >
                                                <option>Active</option>
                                                <option>In Progress</option>
                                                <option>On Hold</option>
                                                <option>Completed</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1 md:col-span-2 pt-2">
                                            <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Live Preview</Label>
                                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 h-96 relative group">
                                                {editedNode.url ? (
                                                    <>
                                                        <iframe 
                                                            src={editedNode.url.startsWith('http') ? editedNode.url : `https://${editedNode.url}`} 
                                                            className="w-full h-full border-0 bg-white"
                                                            title="Site Preview"
                                                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                            <a 
                                                                href={editedNode.url.startsWith('http') ? editedNode.url : `https://${editedNode.url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-white text-black px-4 py-2 rounded-full font-bold shadow-lg pointer-events-auto hover:bg-gray-100 transition-colors flex items-center gap-2"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                                Open Website
                                                            </a>
                                                        </div>
                                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
                                                            If preview is blank, site may block embedding
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                                        Enter a Site URL to see a preview
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Project Metadata</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                                                <span className="text-gray-500 dark:text-gray-400 block mb-1">Created At</span>
                                                <span className="font-bold font-mono dark:text-white">{new Date(editedNode.created_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                                                <span className="text-gray-500 dark:text-gray-400 block mb-1">Node ID</span>
                                                <span className="font-bold font-mono dark:text-white text-xs truncate block">{editedNode.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {isOwner && (
                                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Key className="w-4 h-4" />
                                                    Invite Codes
                                                </h3>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleCreateInvite('client')}
                                                        disabled={creatingInvite}
                                                        size="sm"
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-xs"
                                                    >
                                                        {creatingInvite ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3 mr-1" />}
                                                        New Client Code
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleCreateInvite('member')}
                                                        disabled={creatingInvite}
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        New Member Code
                                                    </Button>
                                                </div>
                                            </div>
                                            {inviteCodes.length === 0 ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No invite codes yet. Create one to share access.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {inviteCodes.map((invite, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                                            <div>
                                                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">{invite.codeHash}</span>
                                                                <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    invite.roleToGrant === 'client' 
                                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' 
                                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                                                                }`}>
                                                                    {invite.roleToGrant}
                                                                </span>
                                                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                                    ({invite.usesLeft} uses left)
                                                                </span>
                                                            </div>
                                                            <Button
                                                                onClick={() => copyToClipboard(invite.codeHash)}
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {['agreement', 'sow', 'oosw', 'code'].includes(activeTab) && (
                                <DocEditor
                                    key={activeTab}
                                    docKey={activeTab === 'code' ? 'siteCode' : activeTab}
                                    node={editedNode}
                                    content={docs[activeTab === 'code' ? 'siteCode' : activeTab] || ''}
                                    onSave={(key, content) => {
                                        handleSaveDoc(key, content);
                                        setDocs(prev => ({ ...prev, [key]: content }));
                                    }}
                                    onShowHistory={(key) => setShowVersionHistory(key)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar */}
                <div className="w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-col hidden lg:flex shrink-0">
                    <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                            <MessageSquare className="w-5 h-5" />
                            Team Chat
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-gray-950">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-400 dark:text-gray-500 mt-12 text-sm">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                <p className="font-medium">No messages yet</p>
                                <p>Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{msg.userName}</span>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(msg.created_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] shadow-sm ${
                                        msg.userId === user.id 
                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none' 
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                                    }`}>
                                        {msg.body}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <button 
                            onClick={handleMagicDraft}
                            disabled={aiLoading || messages.length === 0}
                            className="mb-3 text-xs flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 font-medium"
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

            {showVersionHistory && (
                <VersionHistoryModal
                    nodeId={node.id}
                    docKey={showVersionHistory}
                    currentContent={docs[showVersionHistory] || ''}
                    onClose={() => setShowVersionHistory(null)}
                    onRevert={async (content) => {
                        await handleSaveDoc(showVersionHistory, content);
                    }}
                />
            )}
        </div>
    );
}