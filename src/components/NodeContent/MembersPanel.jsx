import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Shield, Eye, MessageSquare, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROLE_META = {
    owner:  { label: 'Owner',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: Shield,       desc: 'Full access: edit node, docs, manage members, delete' },
    member: { label: 'Member', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',         icon: Users,        desc: 'Can edit documents and chat' },
    client: { label: 'Client', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',     icon: MessageSquare, desc: 'Can view and chat only' },
    viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',            icon: Eye,          desc: 'Read-only access' },
};

export default function MembersPanel({ nodeId, members: initialMembers, currentUserId }) {
    const [members, setMembers] = useState(initialMembers || []);
    const [loading, setLoading] = useState({});
    const [openMenu, setOpenMenu] = useState(null);

    const changeRole = async (member, newRole) => {
        setOpenMenu(null);
        setLoading(prev => ({ ...prev, [member.id]: true }));
        const { data } = await base44.functions.invoke('updateMemberRole', { nodeId, memberId: member.id, newRole });
        if (data.member) {
            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
        }
        setLoading(prev => ({ ...prev, [member.id]: false }));
    };

    const removeMember = async (member) => {
        if (!confirm(`Remove this member?`)) return;
        setLoading(prev => ({ ...prev, [member.id]: true }));
        await base44.functions.invoke('removeMember', { nodeId, memberId: member.id });
        setMembers(prev => prev.filter(m => m.id !== member.id));
        setLoading(prev => ({ ...prev, [member.id]: false }));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Team Members</h3>
                <span className="text-xs text-gray-400 ml-auto">{members.length} member{members.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Role legend */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(ROLE_META).map(([role, meta]) => (
                    <div key={role} className="flex items-start gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <meta.icon className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
                        <div>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{meta.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {members.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">No members found</p>
            ) : (
                <div className="space-y-2">
                    {members.map(member => {
                        const meta = ROLE_META[member.role] || ROLE_META.viewer;
                        const isSelf = member.userId === currentUserId;
                        return (
                            <div key={member.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {(member.userId || '?')[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                        {member.userId}{isSelf && <span className="ml-1 text-xs text-indigo-400">(you)</span>}
                                    </p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>{meta.label}</span>
                                </div>

                                {!isSelf && (
                                    <div className="flex items-center gap-1">
                                        {loading[member.id] ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                        ) : (
                                            <>
                                                {/* Role selector */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                                    >
                                                        Change <ChevronDown className="w-3 h-3" />
                                                    </button>
                                                    {openMenu === member.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden">
                                                            {Object.entries(ROLE_META).filter(([r]) => r !== 'owner').map(([role, rm]) => (
                                                                <button
                                                                    key={role}
                                                                    onClick={() => changeRole(member, role)}
                                                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${member.role === role ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}
                                                                >
                                                                    {rm.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => removeMember(member)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}