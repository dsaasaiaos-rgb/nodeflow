import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/Sidebar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Plus, MessageSquare, User, Users, CheckCircle, Search, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

const formatConversationTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatDateSeparator = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

export default function MessagesPage() {
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-refresh timer — pauses when document is hidden
    useEffect(() => {
        const tick = () => {
            if (document.hidden) return;
            if (activeConversation) {
                fetchMessages(activeConversation.id);
            }
            loadConversations();
        };
        const timer = setInterval(tick, 5000);
        return () => clearInterval(timer);
    }, [activeConversation]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            if (!currentUser) {
                base44.auth.redirectToLogin();
                return;
            }
            setUser(currentUser);
            await loadConversations();
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadConversations = async () => {
        try {
            const { data } = await base44.functions.invoke('chat', { action: 'listConversations' });
            setConversations(data.conversations);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const { data } = await base44.functions.invoke('chat', {
                action: 'getMessages',
                conversationId
            });
            setMessages(data.messages);

            // Mark read locally
            setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, hasRead: true } : c
            ));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectConversation = async (conv) => {
        setActiveConversation(conv);
        setMessages([]);
        setIsLoadingMessages(true);
        try {
            await fetchMessages(conv.id);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !activeConversation || isSending) return;

        const content = newMessage;
        const tempMessage = {
            id: 'temp-' + Date.now(),
            conversationId: activeConversation.id,
            senderId: user.id,
            senderName: user.full_name || user.email,
            content,
            created_date: new Date().toISOString(),
            pending: true,
        };

        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        setIsSending(true);

        try {
            await base44.functions.invoke('chat', {
                action: 'sendMessage',
                conversationId: activeConversation.id,
                content,
            });
            fetchMessages(activeConversation.id);
            loadConversations();
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
            setNewMessage(content);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    // Group messages by date for separators
    const messageGroups = [];
    let lastDateKey = null;
    messages.forEach((msg) => {
        const dateKey = new Date(msg.created_date).toDateString();
        if (dateKey !== lastDateKey) {
            messageGroups.push({ type: 'separator', id: `sep-${dateKey}`, date: msg.created_date });
            lastDateKey = dateKey;
        }
        messageGroups.push({ type: 'message', ...msg });
    });

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
            <Sidebar
                user={user}
                nodes={[]}
                currentView="messages"
                onSelectHub={() => window.location.href = createPageUrl('Hub')}
                onSelectNode={(n) => window.location.href = createPageUrl('NodeView') + '?nodeId=' + n.id}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Conversations List */}
                <div className={`w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
                        <Button
                            onClick={() => setShowNewChatModal(true)}
                            size="icon"
                            aria-label="New conversation"
                            className="h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No conversations yet</p>
                                <Button variant="link" onClick={() => setShowNewChatModal(true)}>Start one</Button>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`w-full p-4 flex items-start gap-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
                                        activeConversation?.id === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                                    }`}
                                >
                                    <div className={`p-2 rounded-full shrink-0 ${conv.type === 'group' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                                        {conv.type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1 gap-2">
                                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                                                {conv.name || 'Chat'}
                                            </span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {conv.lastMessageAt && (
                                                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                                        {formatConversationTime(conv.lastMessageAt)}
                                                    </span>
                                                )}
                                                {!conv.hasRead && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                            </div>
                                        </div>
                                        <p className={`text-sm truncate ${!conv.hasRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {conv.lastMessagePreview || 'No messages'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Back to conversations"
                                    className="md:hidden -ml-2"
                                    onClick={() => setActiveConversation(null)}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <div className={`p-2 rounded-full ${activeConversation.type === 'group' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                                    {activeConversation.type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{activeConversation.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{activeConversation.type === 'group' ? 'Group Chat' : 'Direct Message'}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {isLoadingMessages ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                        <div className="text-center">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm">No messages yet. Say hello!</p>
                                        </div>
                                    </div>
                                ) : (
                                    messageGroups.map((item) => {
                                        if (item.type === 'separator') {
                                            return (
                                                <div key={item.id} className="flex items-center justify-center my-4">
                                                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                                        {formatDateSeparator(item.date)}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        const isMe = item.senderId === user.id;
                                        return (
                                            <div key={item.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                                    isMe
                                                        ? `bg-indigo-600 text-white rounded-br-none ${item.pending ? 'opacity-70' : ''}`
                                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                                                }`}>
                                                    {!isMe && <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{item.senderName}</div>}
                                                    <p className="text-sm whitespace-pre-wrap break-words">{item.content}</p>
                                                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        {new Date(item.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && item.pending && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        aria-label="Message input"
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={!newMessage.trim() || isSending}
                                        aria-label="Send message"
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Select a conversation to start chatting</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            <NewChatModal 
                isOpen={showNewChatModal} 
                onClose={() => setShowNewChatModal(false)}
                onCreated={() => {
                    setShowNewChatModal(false);
                    loadConversations();
                }}
            />
        </div>
    );
}

function NewChatModal({ isOpen, onClose, onCreated }) {
    const [step, setStep] = useState(1);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedUsers([]);
            setGroupName('');
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const { data } = await base44.functions.invoke('chat', { action: 'listUsers' });
            setUsers(data.users || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (selectedUsers.length === 0) return;
        setIsLoading(true);
        
        const type = selectedUsers.length > 1 ? 'group' : 'direct';
        const name = type === 'group' ? groupName : users.find(u => u.id === selectedUsers[0])?.full_name;

        try {
            await base44.functions.invoke('chat', {
                action: 'createConversation',
                type,
                name: name || 'New Chat',
                participantUserIds: selectedUsers
            });
            onCreated();
        } catch (e) {
            toast.error(e.message || "Failed to create conversation.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredUsers = users.filter(u => 
        u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">New Message</h3>

                {step === 1 && (
                    <>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <Input
                                placeholder="Search people..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search people"
                                autoFocus
                            />
                        </div>
                        {selectedUsers.length > 0 && (
                            <div className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                                {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'} selected
                            </div>
                        )}
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                            {isLoading && users.length === 0 ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                                    {search ? 'No people match your search' : 'No users available'}
                                </div>
                            ) : (
                                filteredUsers.map(u => (
                                    <div
                                        key={u.id}
                                        onClick={() => {
                                            if (selectedUsers.includes(u.id)) {
                                                setSelectedUsers(prev => prev.filter(id => id !== u.id));
                                            } else {
                                                setSelectedUsers(prev => [...prev, u.id]);
                                            }
                                        }}
                                        className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-colors ${
                                            selectedUsers.includes(u.id)
                                                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800'
                                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-gray-900 dark:text-white truncate">{u.full_name || 'User'}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</div>
                                        </div>
                                        {selectedUsers.includes(u.id) && <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button
                                disabled={selectedUsers.length === 0 || isLoading}
                                onClick={() => {
                                    if (selectedUsers.length > 1) {
                                        setStep(2);
                                    } else {
                                        handleCreate();
                                    }
                                }}
                            >
                                {isLoading && selectedUsers.length === 1 ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : selectedUsers.length > 1 ? 'Next' : 'Start Chat'}
                            </Button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="mb-4">
                            <label className="text-sm font-medium mb-1 block">Group Name</label>
                            <Input 
                                placeholder="e.g. Marketing Team" 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleCreate} disabled={isLoading || !groupName.trim()}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Create Group'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}