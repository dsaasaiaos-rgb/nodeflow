import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { nodeId, content } = await req.json();

        const isAppAdmin = user.role === 'admin';
        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        const myRole = memberships[0]?.role;
        const canChat = isAppAdmin || myRole === 'owner' || myRole === 'member' || myRole === 'client';

        if (!canChat) {
            return Response.json({ error: 'Viewers cannot send messages' }, { status: 403 });
        }

        const message = await base44.asServiceRole.entities.NodeMessage.create({
            nodeId,
            userId: user.id,
            userName: user.full_name || user.email.split('@')[0],
            body: content
        });

        return Response.json({ message });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});