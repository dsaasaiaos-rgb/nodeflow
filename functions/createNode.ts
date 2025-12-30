import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            console.log("Unauthorized: No user found");
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, url } = await req.json();
        console.log(`Creating node for user ${user.id}: ${name}`);

        if (!name || !description || !url) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create the node using user-scoped client
        // This relies on RLS allowing creation (which it does: "user.id": {"$exists": true})
        const node = await base44.entities.Node.create({
            name,
            description,
            url,
            status: 'Active',
            ownerUserId: user.id
        });

        console.log(`Node created: ${node.id}`);

        // Create owner membership
        // This relies on RLS allowing creation for self
        await base44.entities.NodeMember.create({
            nodeId: node.id,
            userId: user.id,
            role: 'owner'
        });
        
        console.log(`NodeMember created for node ${node.id}`);

        return Response.json({ node });
    } catch (error) {
        console.error("Error creating node:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});