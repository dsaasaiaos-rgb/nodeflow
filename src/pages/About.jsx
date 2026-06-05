import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Layers, Users, MessageSquare, ArrowRight } from 'lucide-react';

export default function AboutPage() {
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
                    <Link to="/About" className="text-indigo-600 dark:text-indigo-400">About</Link>
                    <Link to="/Contact" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Contact</Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">About NodeFlow</h1>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p>
                        NodeFlow is a modern project management and client communication platform built for freelancers,
                        agencies, and small teams who need a centralized hub to manage their work, communicate with clients,
                        and keep every project's documentation in one place.
                    </p>
                    <p>
                        At its core, NodeFlow organizes work into <strong>Nodes</strong> — individual project workspaces
                        that bring together your scope of work, agreements, site code, messages, and team members under a
                        single roof. Whether you're managing a web development project, a design retainer, or an ongoing
                        service contract, each Node gives you everything you need to stay aligned with your clients and
                        collaborators.
                    </p>
                    <p>
                        NodeFlow is designed for professionals who are tired of juggling email threads, scattered documents,
                        and disconnected project tools. With built-in real-time messaging, document versioning, and invite
                        code access control, your clients get a professional portal and your team gets a clean workspace —
                        no extra tools required.
                    </p>
                    <p>
                        Key features include a <strong>Master Hub dashboard</strong> for administrators to oversee all
                        active projects at a glance, a <strong>direct and group messaging</strong> system for seamless
                        communication, and structured document management for agreements, statements of work, and out-of-scope
                        items. Role-based access ensures that owners, members, and clients each see exactly what they need.
                    </p>
                    <p>
                        NodeFlow is built and maintained by a team passionate about making professional collaboration
                        simpler, faster, and more transparent. We believe that the best tools get out of your way and let
                        you focus on doing great work.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
                    {[
                        { Icon: Layers, title: 'Project Nodes', desc: 'Each project lives in its own structured workspace with docs, messages, and members.' },
                        { Icon: MessageSquare, title: 'Built-in Messaging', desc: 'Direct and group chats keep communication tied to the right context.' },
                        { Icon: Users, title: 'Role-Based Access', desc: 'Owners, members, and clients each get the right level of visibility and control.' },
                    ].map(({ Icon, title, desc }) => (
                        <div key={title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl w-fit mb-4">
                                <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex gap-4">
                    <Link to="/" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                        Get Started <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link to="/Contact" className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-6 py-3 rounded-xl font-semibold transition-colors">
                        Contact Us
                    </Link>
                </div>
            </main>

            <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>© {new Date().getFullYear()} NodeFlow. <Link to="/About" className="hover:text-indigo-500">About</Link> · <Link to="/Contact" className="hover:text-indigo-500">Contact</Link></p>
            </footer>
        </div>
    );
}