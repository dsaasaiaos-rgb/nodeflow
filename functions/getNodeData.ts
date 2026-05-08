import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nodeId } = await req.json();

        // Verify user has access to this node
        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        const isOwner = memberships.some(m => m.role === 'owner');
        const isAdmin = user.role === 'admin';
        
        if (memberships.length === 0 && !isAdmin) {
            return Response.json({ error: 'Access denied' }, { status: 403 });
        }

        // Fetch node details, messages and docs
        const node = await base44.asServiceRole.entities.Node.get(nodeId);
        const messages = await base44.asServiceRole.entities.NodeMessage.filter({ nodeId }, '-created_date');
        const docs = await base44.asServiceRole.entities.NodeDoc.filter({ nodeId });

        // Only fetch invite codes for owners/admins
        let inviteCodes = [];
        if (isOwner || isAdmin) {
            inviteCodes = await base44.asServiceRole.entities.NodeInvite.filter({ nodeId });
        }

        return Response.json({ node, messages, docs, isOwner: isOwner || isAdmin, inviteCodes });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});