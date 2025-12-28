import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function CreateNodeModal({ onClose, onCreated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [inviteCode, setInviteCode] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!name || !description || !url) return;
        setIsSubmitting(true);
        
        try {
            const { data: { node } } = await base44.functions.invoke("createNode", { 
                name, 
                description, 
                url
            });

            const { data: { code } } = await base44.functions.invoke("createInvite", { 
                nodeId: node.id, 
                roleToGrant: "client" 
            });

            setInviteCode(code);
            onCreated();
        } catch (err) {
            alert("Failed to create node: " + err.message);
            setIsSubmitting(false);
        }
    };

    if (inviteCode) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Node Created!</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Share this invite code with your team:</p>
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-xl mb-6 border border-indigo-100 dark:border-indigo-800">
                            <p className="text-3xl font-mono font-bold text-center text-indigo-600 dark:text-indigo-400 tracking-wider">{inviteCode}</p>
                        </div>
                        <Button
                            onClick={onClose}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium"
                        >
                            Done
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Node</h3>
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Client/Project Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1"
                            placeholder="Acme Corp Website"
                        />
                    </div>
                    <div>
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1"
                            rows="3"
                            placeholder="E-commerce platform with custom integrations..."
                        />
                    </div>
                    <div>
                        <Label htmlFor="url" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Site URL</Label>
                        <Input
                            id="url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="mt-1"
                            placeholder="https://example.com"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 py-3 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting || !name || !description || !url}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : 'Create Node'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}