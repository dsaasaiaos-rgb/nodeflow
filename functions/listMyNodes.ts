import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin users see all nodes
        if (user.role === 'admin') {
            const nodes = await base44.entities.Node.list('-created_date');
            return Response.json({ nodes });
        }

        // Regular users see only nodes they're members of
        const memberships = await base44.entities.NodeMember.filter({ userId: user.id });
        const nodeIds = memberships.map(m => m.nodeId);
        
        if (nodeIds.length === 0) {
            return Response.json({ nodes: [] });
        }

        const nodes = await base44.entities.Node.list('-created_date');
        const userNodes = nodes.filter(n => nodeIds.includes(n.id));
        
        return Response.json({ nodes: userNodes });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});