import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { code } = await req.json();

        if (!code) {
            return Response.json({ error: 'Code required' }, { status: 400 });
        }

        // Find valid invite
        const invites = await base44.asServiceRole.entities.NodeInvite.filter({ codeHash: code.toUpperCase() });
        const invite = invites.find(i => i.usesLeft > 0);

        if (!invite) {
            return Response.json({ error: 'Invalid or expired invite code' }, { status: 404 });
        }

        // Check if already a member
        const existing = await base44.asServiceRole.entities.NodeMember.filter({ 
            nodeId: invite.nodeId, 
            userId: user.id 
        });

        if (existing.length === 0) {
            await base44.asServiceRole.entities.NodeMember.create({
                nodeId: invite.nodeId,
                userId: user.id,
                role: invite.roleToGrant
            });
        }

        // Decrement uses
        await base44.asServiceRole.entities.NodeInvite.update(invite.id, {
            usesLeft: invite.usesLeft - 1
        });

        return Response.json({ 
            nodeId: invite.nodeId, 
            role: invite.roleToGrant 
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});