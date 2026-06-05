import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/Sidebar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Plus, MessageSquare, User, Users, CheckCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';

export default function MessagesPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Auto-refresh timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeConversation) {
        fetchMessages(activeConversation.id, true);
      }
      loadConversations(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeConversation]);

  useEffect(() => {
    loadData();
  }, []);

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

  const loadConversations = async (silent = false) => {
    try {
      const { data } = await base44.functions.invoke('chat', { action: 'listConversations' });
      setConversations(data.conversations);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (conversationId, silent = false) => {
    try {
      const { data } = await base44.functions.invoke('chat', {
        action: 'getMessages',
        conversationId
      });
      setMessages(data.messages);

      // Mark read locally
      setConversations((prev) => prev.map((c) =>
      c.id === conversationId ? { ...c, hasRead: true } : c
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setMessages([]); // Clear previous
    fetchMessages(conv.id);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const tempMessage = {
      id: 'temp-' + Date.now(),
      conversationId: activeConversation.id,
      senderId: user.id,
      senderName: user.full_name || user.email,
      content: newMessage,
      created_date: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');

    try {
      await base44.functions.invoke('chat', {
        action: 'sendMessage',
        conversationId: activeConversation.id,
        content: tempMessage.content
      });
      // Refresh real messages
      fetchMessages(activeConversation.id, true);
      loadConversations(true);
    } catch (e) {
      alert("Failed to send");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
            <Sidebar
        user={user}
        nodes={[]} // Not needed for messaging view mainly
        currentView="messages"
        onSelectHub={() => window.location.href = createPageUrl('Hub')}
        onSelectNode={(n) => window.location.href = createPageUrl('NodeView') + '?nodeId=' + n.id}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen} />
      

            <div className="flex-1 flex overflow-hidden">
                {/* Conversations List */}
                <div className={`w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center hidden">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
                        <Button onClick={() => setShowNewChatModal(true)} size="icon" className="h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto hidden">
                        {conversations.length === 0 ?
            <div className="p-8 text-center text-gray-500 hidden">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No conversations yet</p>
                                <Button variant="link" onClick={() => setShowNewChatModal(true)}>Start one</Button>
                            </div> :

            conversations.map((conv) =>
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className={`w-full p-4 flex items-start gap-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
              activeConversation?.id === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`
              }>
              
                                    <div className={`p-2 rounded-full ${conv.type === 'group' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {conv.type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                                                {conv.name || 'Chat'}
                                            </span>
                                            {!conv.hasRead && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                        </div>
                                        <p className={`text-sm truncate ${!conv.hasRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                            {conv.lastMessagePreview || 'No messages'}
                                        </p>
                                    </div>
                                </button>
            )
            }
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
                    {activeConversation ?
          <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                                <Button variant="ghost" className="md:hidden" onClick={() => setActiveConversation(null)}>Back</Button>
                                <div className={`p-2 rounded-full ${activeConversation.type === 'group' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {activeConversation.type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{activeConversation.name}</h3>
                                    <p className="text-xs text-gray-500">{activeConversation.type === 'group' ? 'Group Chat' : 'Direct Message'}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isMe ?
                    'bg-indigo-600 text-white rounded-br-none' :
                    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none'}`
                    }>
                                                {!isMe && <div className="text-xs font-bold text-gray-500 mb-1">{msg.senderName}</div>}
                                                <p className="text-sm">{msg.content}</p>
                                                <div className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>);

              })}
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1" />
                
                                    <Button onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </> :

          <div className="flex-1 flex flex-col">
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Select a conversation to start chatting</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <Input
                  disabled
                  placeholder="Select a conversation to send a message..."
                  className="flex-1 opacity-50 cursor-not-allowed" />
                
                                    <Button disabled className="opacity-50 cursor-not-allowed">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
          }
                </div>
            </div>

            {/* New Chat Modal */}
            <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onCreated={() => {
          setShowNewChatModal(false);
          loadConversations();
        }} />
      
        </div>);

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
    const name = type === 'group' ? groupName : users.find((u) => u.id === selectedUsers[0])?.full_name;

    try {
      await base44.functions.invoke('chat', {
        action: 'createConversation',
        type,
        name: name || 'New Chat',
        participantUserIds: selectedUsers
      });
      onCreated();
    } catch (e) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) =>
  u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
  u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">New Message</h3>
                
                {step === 1 &&
        <>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <Input
              placeholder="Search people..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)} />
            
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                            {filteredUsers.map((u) =>
            <div
              key={u.id}
              onClick={() => {
                if (selectedUsers.includes(u.id)) {
                  setSelectedUsers((prev) => prev.filter((id) => id !== u.id));
                } else {
                  setSelectedUsers((prev) => [...prev, u.id]);
                }
              }}
              className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border ${
              selectedUsers.includes(u.id) ?
              'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' :
              'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'}`
              }>
              
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{u.full_name || 'User'}</div>
                                        <div className="text-xs text-gray-500">{u.email}</div>
                                    </div>
                                    {selectedUsers.includes(u.id) && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                                </div>
            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button
              disabled={selectedUsers.length === 0}
              onClick={() => {
                if (selectedUsers.length > 1) {
                  setStep(2);
                } else {
                  handleCreate();
                }
              }}>
              
                                {selectedUsers.length > 1 ? 'Next' : 'Start Chat'}
                            </Button>
                        </div>
                    </>
        }

                {step === 2 &&
        <>
                        <div className="mb-4">
                            <label className="text-sm font-medium mb-1 block">Group Name</label>
                            <Input
              placeholder="e.g. Marketing Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)} />
            
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleCreate} disabled={isLoading || !groupName.trim()}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Create Group'}
                            </Button>
                        </div>
                    </>
        }
            </div>
        </div>);

}