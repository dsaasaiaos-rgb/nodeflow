import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt } = await req.json();

        if (!prompt) {
            return Response.json({ error: 'Prompt required' }, { status: 400 });
        }

        const apiKey = Deno.env.get("GEMINI_API_KEY");
        
        if (!apiKey) {
            return Response.json({ error: 'Gemini API key not configured' }, { status: 500 });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Gemini API request failed');
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI generation failed.";

        return Response.json({ text });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});