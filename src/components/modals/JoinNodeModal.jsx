import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function JoinNodeModal({ onClose, onJoined }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleJoin = async () => {
        if (!code) return;
        setIsSubmitting(true);
        setError('');
        
        try {
            await base44.functions.invoke("redeemInvite", { 
                code: code.toUpperCase()
            });
            
            setSuccess(true);
            onJoined();
            setTimeout(() => onClose(), 1500);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
                >
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">Successfully joined node!</p>
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
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Join Node</h3>
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="code" className="text-sm font-semibold text-gray-700 mb-2">Invite Code</Label>
                        <Input
                            id="code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                            className="mt-1 font-mono text-center text-lg tracking-widest"
                            placeholder="XXXXXXXX"
                            maxLength={8}
                        />
                    </div>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200"
                        >
                            {error}
                        </motion.div>
                    )}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 py-3 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleJoin}
                            disabled={isSubmitting || !code}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Joining...
                                </>
                            ) : 'Join Node'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}