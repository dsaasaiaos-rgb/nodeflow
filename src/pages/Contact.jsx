import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Mail, Twitter, Github, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Opens mailto as a simple contact method
        const subject = encodeURIComponent(`Message from ${form.name}`);
        const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
        window.location.href = `mailto:hello@nodeflow.app?subject=${subject}&body=${body}`;
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-white">
            {/* Nav */}
            <nav className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between max-w-5xl mx-auto">
                <Link to="/" className="flex items-center gap-2 font-bold text-lg text-indigo-600 dark:text-indigo-400">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                        <Home className="w-4 h-4 text-white" />
                    </div>
                    NodeFlow
                </Link>
                <div className="flex gap-4 text-sm font-medium">
                    <Link to="/About" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">About</Link>
                    <Link to="/Contact" className="text-indigo-600 dark:text-indigo-400">Contact</Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">Contact Us</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-12 text-lg">We'd love to hear from you. Reach out through any of the methods below.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">Email us at</p>
                                <a href="mailto:hello@nodeflow.app" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                    hello@nodeflow.app
                                </a>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                                <Twitter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">Follow us on X</p>
                                <a href="https://twitter.com/nodeflowapp" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                    @nodeflowapp
                                </a>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                                <Github className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">Open source on GitHub</p>
                                <a href="https://github.com/nodeflowapp" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                    github.com/nodeflowapp
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                        {submitted ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Message sent!</h3>
                                <p className="text-gray-500 dark:text-gray-400">Your email client should have opened. We'll get back to you soon.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                    <Input
                                        required
                                        placeholder="Your name"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <Input
                                        required
                                        type="email"
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                                    <textarea
                                        required
                                        rows={5}
                                        placeholder="How can we help?"
                                        value={form.message}
                                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                                    <Send className="w-4 h-4" /> Send Message
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>© {new Date().getFullYear()} NodeFlow. <Link to="/About" className="hover:text-indigo-500">About</Link> · <Link to="/Contact" className="hover:text-indigo-500">Contact</Link></p>
            </footer>
        </div>
    );
}