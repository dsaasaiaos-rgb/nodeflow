import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { projectId, datasetId, tableId, dateRange } = await req.json();

        if (!projectId || !datasetId || !tableId) {
            return Response.json({ error: 'projectId, datasetId, and tableId are required' }, { status: 400 });
        }

        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlebigquery');

        const daysBack = dateRange || 30;
        const query = `
            SELECT
                campaign_name,
                SUM(impressions) AS total_impressions,
                SUM(clicks) AS total_clicks,
                SUM(conversions) AS total_conversions,
                SUM(spend) AS total_spend,
                SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100 AS ctr,
                SAFE_DIVIDE(SUM(conversions), SUM(clicks)) * 100 AS conversion_rate,
                SAFE_DIVIDE(SUM(spend), SUM(conversions)) AS cost_per_conversion
            FROM \`${projectId}.${datasetId}.${tableId}\`
            WHERE DATE(date) >= DATE_SUB(CURRENT_DATE(), INTERVAL ${daysBack} DAY)
            GROUP BY campaign_name
            ORDER BY total_spend DESC
            LIMIT 50
        `;

        const response = await fetch(
            `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    useLegacySql: false,
                    timeoutMs: 30000,
                }),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            return Response.json({ error: result.error?.message || 'BigQuery error' }, { status: 500 });
        }

        const fields = result.schema?.fields || [];
        const rows = (result.rows || []).map(row => {
            const obj = {};
            row.f.forEach((cell, i) => {
                const val = cell.v;
                obj[fields[i].name] = val !== null ? (isNaN(val) ? val : Number(val)) : null;
            });
            return obj;
        });

        return Response.json({ rows, fields: fields.map(f => f.name), totalRows: rows.length });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});