import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, url } = await req.json();

        if (!name || !description || !url) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create the node
        const node = await base44.entities.Node.create({
            name,
            description,
            url,
            status: 'Active',
            ownerUserId: user.id
        });

        // Create owner membership
        await base44.entities.NodeMember.create({
            nodeId: node.id,
            userId: user.id,
            role: 'owner'
        });

        return Response.json({ node });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});