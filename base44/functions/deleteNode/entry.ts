import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { nodeId } = await req.json();
        if (!nodeId) return Response.json({ error: 'Node ID required' }, { status: 400 });

        const node = await base44.asServiceRole.entities.Node.get(nodeId);
        if (!node) return Response.json({ error: 'Node not found' }, { status: 404 });

        const isAppAdmin = user.role === 'admin';
        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        const myRole = memberships[0]?.role;
        const canDelete = isAppAdmin || myRole === 'owner';

        if (!canDelete) {
            return Response.json({ error: 'Only owners can delete nodes' }, { status: 403 });
        }

        // Clean up all related data
        const [members, docs, messages, invites] = await Promise.all([
            base44.asServiceRole.entities.NodeMember.filter({ nodeId }),
            base44.asServiceRole.entities.NodeDoc.filter({ nodeId }),
            base44.asServiceRole.entities.NodeMessage.filter({ nodeId }),
            base44.asServiceRole.entities.NodeInvite.filter({ nodeId }),
        ]);

        await Promise.all([
            ...members.map(m => base44.asServiceRole.entities.NodeMember.delete(m.id)),
            ...docs.map(d => base44.asServiceRole.entities.NodeDoc.delete(d.id)),
            ...messages.map(m => base44.asServiceRole.entities.NodeMessage.delete(m.id)),
            ...invites.map(i => base44.asServiceRole.entities.NodeInvite.delete(i.id)),
        ]);

        await base44.asServiceRole.entities.Node.delete(nodeId);
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});