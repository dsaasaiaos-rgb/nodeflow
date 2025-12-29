import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { nodeId, key } = await req.json();

        // Verify access
        const memberships = await base44.asServiceRole.entities.NodeMember.filter({ nodeId, userId: user.id });
        
        if (memberships.length === 0 && user.role !== 'admin') {
            return Response.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get versions sorted by date descending
        const versions = await base44.asServiceRole.entities.DocVersion.filter(
            { nodeId, key },
            '-created_date',
            50
        );

        return Response.json({ versions });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});