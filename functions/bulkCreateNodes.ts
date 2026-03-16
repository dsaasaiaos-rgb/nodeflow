import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const LINKS = [
    { name: 'Own Your Tune', url: 'https://own-your-tune.base44.app', description: 'Deployed Base44 App' },
    { name: 'LiveStage', url: 'https://livestage.base44.app', description: 'Deployed Base44 App' },
    { name: 'Node Flow', url: 'https://node-flow-8e976283.base44.app', description: 'Deployed Base44 App' },
    { name: 'Funnel Flow AI', url: 'https://berserk-funnel-flow-ai.base44.app', description: 'Deployed Base44 App' },
    { name: 'Clippy AI', url: 'https://clippyai-xujkpjit.manus.space', description: 'Manus Space AI Project' },
    { name: 'Manus AI Web', url: 'https://manusaiweb-mn7pxele.manus.space', description: 'Manus Space AI Project' },
    { name: 'ItsFamStream', url: 'https://itsfamstream-xnbhojhr.manus.space', description: 'Manus Space AI Project' },
    { name: 'TruthOps', url: 'https://truthops-emfa9ctd.manus.space', description: 'Manus Space AI Project' },
    { name: 'Manus Course', url: 'https://manuscourse-ea9ght4t.manus.space/', description: 'Manus Space AI Project' },
    { name: 'PulseOS Dash', url: 'https://pulseosdash-yw7fvb78.manus.space/', description: 'Manus Space AI Project' },
    { name: 'Global Lens', url: 'https://globallens.manus.space', description: 'Manus Space AI Project' },
    { name: 'Stress Test', url: 'https://stresstest-n4u7re5i.manus.space/', description: 'Manus Space AI Project' },
    { name: 'Manus AI (General)', url: 'https://manusai-jgiackvu.manus.space/', description: 'Manus Space AI Project' },
    { name: 'Music Prom Hub', url: 'https://musicpromhub-cnnyypxa.manus.space', description: 'Manus Space AI Project' },
    { name: 'Rap Motion', url: 'https://rapmotion-3exqkpar.manus.space', description: 'Manus Space AI Project' },
    { name: 'Echo Music', url: 'https://echomusic-fa6znjnb.manus.space/', description: 'Manus Space AI Project' },
    { name: 'Funny News', url: 'https://funnynews-7276cxiu.manus.space', description: 'Manus Space AI Project' },
    { name: 'HookGen IG', url: 'https://hookgenig-3ckcckwv.manus.space', description: 'Manus Space AI Project' },
    { name: 'Creator Hub', url: 'https://creatorhub-9tr3cccg.manus.space', description: 'Manus Space AI Project' },
    { name: 'AI Auto Dash', url: 'https://aiautodash-7ko78ohb.manus.space', description: 'Manus Space AI Project' },
    { name: 'Manus Workspace Share', url: 'https://manus.im/share/mRcPXk9tJiUcSthv42nmww', description: 'Manus Shared Resource' },
    { name: 'Manus File Share', url: 'https://manus.im/share/file/e67644d7-0d65-4e5e-831a-2d95d027e96a', description: 'Manus Shared Resource' },
    { name: 'TubePilot', url: 'https://app.base44.com/apps/69b741ca441be2ffc9482bc3/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'ManusFlow', url: 'https://app.base44.com/apps/69b74ce04012b4033b6e3e1c/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Autonomous Agent Workspace', url: 'https://app.base44.com/apps/69a8cd797301dc683a486f0c/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'NodeFlow', url: 'https://app.base44.com/apps/695191e2c095912d8e976283/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'RolloutSync', url: 'https://app.base44.com/apps/69b5fe9ac0b55535c3dd9d4d/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'LiveStage Editor', url: 'https://app.base44.com/apps/69ae7f4445d0775dc4b8eff3/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'District65news', url: 'https://app.base44.com/apps/694db2931db598a966861773/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'ArtistFlywheel', url: 'https://app.base44.com/apps/69b4bf0da09e83f6b7503a5b/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Unnamed Music Agency Platform', url: 'https://app.base44.com/plan?id=69b4b4cc5562898f235bfbc7', description: 'Base44 Plan Mode' },
    { name: 'ArtistPulse', url: 'https://app.base44.com/apps/69b4931feb0e8ffce83f9ea2/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'PressAgent', url: 'https://app.base44.com/apps/694891ab550031eff3c646f5/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'ShareTune', url: 'https://app.base44.com/apps/69b36c41ac48ee8c34a6520e/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Hip-Hop Career Simulator', url: 'https://app.base44.com/plan?id=69b37bdcfcb474ec44cec88f', description: 'Base44 Plan Mode' },
    { name: "Big Buddy's Moving Co. (Copy)", url: 'https://app.base44.com/apps/6991b2bb77b6890f74928890/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Campaign Trail', url: 'https://app.base44.com/apps/694cd80c2b98e9aaf6f99cca/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Melody Muse', url: 'https://app.base44.com/apps/69ad1fbb996f05d2c73bfe4f/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'FunnelFlow AI', url: 'https://app.base44.com/apps/69a9385dc72e6d26679cba19/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'PressAgent.me', url: 'https://app.base44.com/apps/6948cabc3257888495ee7ccc/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Channel Insights', url: 'https://app.base44.com/apps/69ab83e2dbe0a47e0f87e8a9/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Visual Canvas', url: 'https://app.base44.com/apps/694a2be129197176916502fe/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Job Seeker Pro', url: 'https://app.base44.com/apps/69aa639c764b597729798b5a/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Startup Ideator', url: 'https://app.base44.com/apps/6996aec70da668f43d7d5340/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'CreatorHub', url: 'https://app.base44.com/apps/69565cfc0aa2c80c20f4a4ca/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Artist Amplify', url: 'https://app.base44.com/apps/69aa7776f437ca671f93d8fb/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'ChatFlow', url: 'https://app.base44.com/apps/698962781077d7aaabccecdc/editor/preview', description: 'Base44 App Editor Preview' },
    { name: "Big Buddy's Moving Co.", url: 'https://app.base44.com/apps/698927378a6a1c971cb14887/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'RapFlow', url: 'https://app.base44.com/apps/69a4958b8cf51d37653c7b16/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'OmniMind', url: 'https://app.base44.com/apps/69a9b9157a7b1e4df2eadf4d/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'TruthOps (3-Pass Verification)', url: 'https://app.base44.com/apps/69a940bb8f5be7d37fed3f00/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'BizStrategy', url: 'https://app.base44.com/apps/69573c1d4a6949cff67cfc30/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'PathForward', url: 'https://app.base44.com/apps/6999bda3d0bfafb6b128b36d/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'GameLogic Forge', url: 'https://app.base44.com/apps/6996a9817e56b9fbe9743569/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'PayStub', url: 'https://app.base44.com/apps/697d907958a42281212a6b0a/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'LegacyTree', url: 'https://app.base44.com/apps/69605f7a8522dacb1b3e37af/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'PromptSensei', url: 'https://app.base44.com/apps/697d327bc514c9c1cf381528/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'untitled', url: 'https://app.base44.com/apps/694b813dc36271baf296968c/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'SmartLens', url: 'https://app.base44.com/apps/694905ac7b492b13d633ee88/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'SonicPulse', url: 'https://app.base44.com/apps/6949a63a48e273434f3efe16/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Golden Kernel', url: 'https://app.base44.com/apps/694b96dbebe0253dbad21e6f/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'StoryWeaver', url: 'https://app.base44.com/apps/694bb19bf3a989ea5ac0cbaa/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Shadow Realm', url: 'https://app.base44.com/apps/694ca464c72916bb4e0f55b1/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Harmony Hub', url: 'https://app.base44.com/apps/69535cc39170124ed0bbb57e/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'StemSplit', url: 'https://app.base44.com/apps/6957fda17e8653ffa3450282/editor/preview', description: 'Base44 App Editor Preview' },
    { name: 'Artistry Unveiled', url: 'https://app.base44.com/apps/695991fded84050de43adca4/editor/preview', description: 'Base44 App Editor Preview' },
];

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const results = [];
        const errors = [];

        for (const link of LINKS) {
            try {
                const node = await base44.asServiceRole.entities.Node.create({
                    name: link.name,
                    description: link.description,
                    url: link.url,
                    status: 'Active',
                    ownerUserId: user.id
                });
                await base44.asServiceRole.entities.NodeMember.create({
                    nodeId: node.id,
                    userId: user.id,
                    role: 'owner'
                });
                results.push(node.id);
            } catch (e) {
                errors.push({ name: link.name, error: e.message });
            }
        }

        return Response.json({ created: results.length, errors });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});