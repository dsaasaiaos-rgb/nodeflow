import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nodeId, roleToGrant } = await req.json();

        // Verify user has permission (owner or admin)
        const memberships = await base44.entities.NodeMember.filter({ nodeId, userId: user.id });
        const isOwner = memberships.some(m => m.role === 'owner');
        
        if (!isOwner && user.role !== 'admin') {
            return Response.json({ error: 'Only owners can create invites' }, { status: 403 });
        }

        // Generate random code
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();

        await base44.entities.NodeInvite.create({
            nodeId,
            codeHash: code,
            roleToGrant: roleToGrant || 'client',
            usesLeft: 1
        });

        return Response.json({ code });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});