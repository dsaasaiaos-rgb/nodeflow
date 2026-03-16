import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import Sidebar from '@/components/Sidebar';
import { ExternalLink, Search, X } from 'lucide-react';

const LINKS = [
    // Deployed Apps
    { category: 'Deployed Apps', name: 'Own Your Tune', url: 'https://own-your-tune.base44.app' },
    { category: 'Deployed Apps', name: 'LiveStage', url: 'https://livestage.base44.app' },
    { category: 'Deployed Apps', name: 'Node Flow', url: 'https://node-flow-8e976283.base44.app' },
    { category: 'Deployed Apps', name: 'Funnel Flow AI', url: 'https://berserk-funnel-flow-ai.base44.app' },

    // Manus Space
    { category: 'Manus Space', name: 'Clippy AI', url: 'https://clippyai-xujkpjit.manus.space' },
    { category: 'Manus Space', name: 'Manus AI Web', url: 'https://manusaiweb-mn7pxele.manus.space' },
    { category: 'Manus Space', name: 'ItsFamStream', url: 'https://itsfamstream-xnbhojhr.manus.space' },
    { category: 'Manus Space', name: 'TruthOps', url: 'https://truthops-emfa9ctd.manus.space' },
    { category: 'Manus Space', name: 'Manus Course', url: 'https://manuscourse-ea9ght4t.manus.space/' },
    { category: 'Manus Space', name: 'PulseOS Dash', url: 'https://pulseosdash-yw7fvb78.manus.space/' },
    { category: 'Manus Space', name: 'Global Lens', url: 'https://globallens.manus.space' },
    { category: 'Manus Space', name: 'Stress Test', url: 'https://stresstest-n4u7re5i.manus.space/' },
    { category: 'Manus Space', name: 'Manus AI (General)', url: 'https://manusai-jgiackvu.manus.space/' },
    { category: 'Manus Space', name: 'Music Prom Hub', url: 'https://musicpromhub-cnnyypxa.manus.space' },
    { category: 'Manus Space', name: 'Rap Motion', url: 'https://rapmotion-3exqkpar.manus.space' },
    { category: 'Manus Space', name: 'Echo Music', url: 'https://echomusic-fa6znjnb.manus.space/' },
    { category: 'Manus Space', name: 'Funny News', url: 'https://funnynews-7276cxiu.manus.space' },
    { category: 'Manus Space', name: 'HookGen IG', url: 'https://hookgenig-3ckcckwv.manus.space' },
    { category: 'Manus Space', name: 'Creator Hub', url: 'https://creatorhub-9tr3cccg.manus.space' },
    { category: 'Manus Space', name: 'AI Auto Dash', url: 'https://aiautodash-7ko78ohb.manus.space' },

    // Manus Shared Resources
    { category: 'Manus Shared', name: 'Manus Workspace Share', url: 'https://manus.im/share/mRcPXk9tJiUcSthv42nmww' },
    { category: 'Manus Shared', name: 'Manus File Share', url: 'https://manus.im/share/file/e67644d7-0d65-4e5e-831a-2d95d027e96a' },

    // Base44 Editor Previews
    { category: 'Base44 Editor', name: 'TubePilot', url: 'https://app.base44.com/apps/69b741ca441be2ffc9482bc3/editor/preview' },
    { category: 'Base44 Editor', name: 'ManusFlow', url: 'https://app.base44.com/apps/69b74ce04012b4033b6e3e1c/editor/preview' },
    { category: 'Base44 Editor', name: 'Autonomous Agent Workspace', url: 'https://app.base44.com/apps/69a8cd797301dc683a486f0c/editor/preview' },
    { category: 'Base44 Editor', name: 'NodeFlow', url: 'https://app.base44.com/apps/695191e2c095912d8e976283/editor/preview' },
    { category: 'Base44 Editor', name: 'RolloutSync', url: 'https://app.base44.com/apps/69b5fe9ac0b55535c3dd9d4d/editor/preview' },
    { category: 'Base44 Editor', name: 'LiveStage', url: 'https://app.base44.com/apps/69ae7f4445d0775dc4b8eff3/editor/preview' },
    { category: 'Base44 Editor', name: 'District65news', url: 'https://app.base44.com/apps/694db2931db598a966861773/editor/preview' },
    { category: 'Base44 Editor', name: 'ArtistFlywheel', url: 'https://app.base44.com/apps/69b4bf0da09e83f6b7503a5b/editor/preview' },
    { category: 'Base44 Editor', name: 'Unnamed Music Agency Platform (Plan)', url: 'https://app.base44.com/plan?id=69b4b4cc5562898f235bfbc7' },
    { category: 'Base44 Editor', name: 'ArtistPulse', url: 'https://app.base44.com/apps/69b4931feb0e8ffce83f9ea2/editor/preview' },
    { category: 'Base44 Editor', name: 'PressAgent', url: 'https://app.base44.com/apps/694891ab550031eff3c646f5/editor/preview' },
    { category: 'Base44 Editor', name: 'ShareTune', url: 'https://app.base44.com/apps/69b36c41ac48ee8c34a6520e/editor/preview' },
    { category: 'Base44 Editor', name: 'Hip-Hop Career Simulator (Plan)', url: 'https://app.base44.com/plan?id=69b37bdcfcb474ec44cec88f' },
    { category: 'Base44 Editor', name: "Big Buddy's Moving Co. (Copy)", url: 'https://app.base44.com/apps/6991b2bb77b6890f74928890/editor/preview' },
    { category: 'Base44 Editor', name: 'Campaign Trail', url: 'https://app.base44.com/apps/694cd80c2b98e9aaf6f99cca/editor/preview' },
    { category: 'Base44 Editor', name: 'Melody Muse', url: 'https://app.base44.com/apps/69ad1fbb996f05d2c73bfe4f/editor/preview' },
    { category: 'Base44 Editor', name: 'FunnelFlow AI', url: 'https://app.base44.com/apps/69a9385dc72e6d26679cba19/editor/preview' },
    { category: 'Base44 Editor', name: 'PressAgent.me', url: 'https://app.base44.com/apps/6948cabc3257888495ee7ccc/editor/preview' },
    { category: 'Base44 Editor', name: 'Channel Insights', url: 'https://app.base44.com/apps/69ab83e2dbe0a47e0f87e8a9/editor/preview' },
    { category: 'Base44 Editor', name: 'Visual Canvas', url: 'https://app.base44.com/apps/694a2be129197176916502fe/editor/preview' },
    { category: 'Base44 Editor', name: 'Job Seeker Pro', url: 'https://app.base44.com/apps/69aa639c764b597729798b5a/editor/preview' },
    { category: 'Base44 Editor', name: 'Startup Ideator', url: 'https://app.base44.com/apps/6996aec70da668f43d7d5340/editor/preview' },
    { category: 'Base44 Editor', name: 'CreatorHub', url: 'https://app.base44.com/apps/69565cfc0aa2c80c20f4a4ca/editor/preview' },
    { category: 'Base44 Editor', name: 'Artist Amplify', url: 'https://app.base44.com/apps/69aa7776f437ca671f93d8fb/editor/preview' },
    { category: 'Base44 Editor', name: 'ChatFlow', url: 'https://app.base44.com/apps/698962781077d7aaabccecdc/editor/preview' },
    { category: 'Base44 Editor', name: "Big Buddy's Moving Co.", url: 'https://app.base44.com/apps/698927378a6a1c971cb14887/editor/preview' },
    { category: 'Base44 Editor', name: 'RapFlow', url: 'https://app.base44.com/apps/69a4958b8cf51d37653c7b16/editor/preview' },
    { category: 'Base44 Editor', name: 'OmniMind', url: 'https://app.base44.com/apps/69a9b9157a7b1e4df2eadf4d/editor/preview' },
    { category: 'Base44 Editor', name: 'TruthOps (3-Pass Verification)', url: 'https://app.base44.com/apps/69a940bb8f5be7d37fed3f00/editor/preview' },
    { category: 'Base44 Editor', name: 'BizStrategy', url: 'https://app.base44.com/apps/69573c1d4a6949cff67cfc30/editor/preview' },
    { category: 'Base44 Editor', name: 'PathForward', url: 'https://app.base44.com/apps/6999bda3d0bfafb6b128b36d/editor/preview' },
    { category: 'Base44 Editor', name: 'GameLogic Forge', url: 'https://app.base44.com/apps/6996a9817e56b9fbe9743569/editor/preview' },
    { category: 'Base44 Editor', name: 'PayStub', url: 'https://app.base44.com/apps/697d907958a42281212a6b0a/editor/preview' },
    { category: 'Base44 Editor', name: 'LegacyTree', url: 'https://app.base44.com/apps/69605f7a8522dacb1b3e37af/editor/preview' },
    { category: 'Base44 Editor', name: 'PromptSensei', url: 'https://app.base44.com/apps/697d327bc514c9c1cf381528/editor/preview' },
    { category: 'Base44 Editor', name: 'untitled', url: 'https://app.base44.com/apps/694b813dc36271baf296968c/editor/preview' },
    { category: 'Base44 Editor', name: 'SmartLens', url: 'https://app.base44.com/apps/694905ac7b492b13d633ee88/editor/preview' },
    { category: 'Base44 Editor', name: 'SonicPulse', url: 'https://app.base44.com/apps/6949a63a48e273434f3efe16/editor/preview' },
    { category: 'Base44 Editor', name: 'Golden Kernel', url: 'https://app.base44.com/apps/694b96dbebe0253dbad21e6f/editor/preview' },
    { category: 'Base44 Editor', name: 'StoryWeaver', url: 'https://app.base44.com/apps/694bb19bf3a989ea5ac0cbaa/editor/preview' },
    { category: 'Base44 Editor', name: 'Shadow Realm', url: 'https://app.base44.com/apps/694ca464c72916bb4e0f55b1/editor/preview' },
    { category: 'Base44 Editor', name: 'Harmony Hub', url: 'https://app.base44.com/apps/69535cc39170124ed0bbb57e/editor/preview' },
    { category: 'Base44 Editor', name: 'StemSplit', url: 'https://app.base44.com/apps/6957fda17e8653ffa3450282/editor/preview' },
    { category: 'Base44 Editor', name: 'Artistry Unveiled', url: 'https://app.base44.com/apps/695991fded84050de43adca4/editor/preview' },
];

const CATEGORY_COLORS = {
    'Deployed Apps': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    'Manus Space': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    'Manus Shared': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    'Base44 Editor': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
};

const CATEGORIES = ['All', 'Deployed Apps', 'Manus Space', 'Manus Shared', 'Base44 Editor'];

export default function LinksPage() {
    const [user, setUser] = React.useState(null);
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    React.useEffect(() => {
        base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
    }, []);

    const filtered = LINKS.filter(link => {
        const matchesSearch = link.name.toLowerCase().includes(search.toLowerCase()) || link.url.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'All' || link.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const grouped = CATEGORIES.slice(1).reduce((acc, cat) => {
        const items = filtered.filter(l => l.category === cat);
        if (items.length) acc[cat] = items;
        return acc;
    }, {});

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
            <Sidebar
                user={user}
                nodes={[]}
                currentView="links"
                onSelectHub={() => window.location.href = '/Hub'}
                onSelectNode={() => {}}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8 mt-8 lg:mt-0">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">My Links</h1>
                        <p className="text-gray-500 dark:text-gray-400">{LINKS.length} links across {CATEGORIES.length - 1} categories</p>
                    </div>

                    {/* Search + Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search links..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                        activeCategory === cat
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Links Grid */}
                    {Object.keys(grouped).length === 0 ? (
                        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No links found</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, links]) => (
                            <div key={category} className="mb-8">
                                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{category}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {links.map(link => (
                                        <a
                                            key={link.url}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{link.name}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{link.url.replace('https://', '')}</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 transition-colors shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}