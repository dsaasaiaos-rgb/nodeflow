import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { nodeId, roleToGrant } = await req.json();

        const allowedRoles = ['member', 'client', 'viewer'];
        const role = allowedRoles.includes(roleToGrant) ? roleToGrant : 'client';

        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        const canManage = user.role === 'admin' || memberships[0]?.role === 'owner';

        if (!canManage) {
            return Response.json({ error: 'Only owners can create invites' }, { status: 403 });
        }

        const code = Math.random().toString(36).substring(2, 10).toUpperCase();

        await base44.asServiceRole.entities.NodeInvite.create({
            nodeId,
            codeHash: code,
            roleToGrant: role,
            usesLeft: 1
        });

        return Response.json({ code });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});