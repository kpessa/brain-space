"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brainSpaceMCPServer = void 0;
const genkitx_mcp_1 = require("genkitx-mcp");
const admin = require("firebase-admin");
const zod_1 = require("zod");
// Define the schema for Brain Space resources
const NodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    text: zod_1.z.string(),
    category: zod_1.z.string(),
    urgency: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    importance: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    dueDate: zod_1.z.string().optional(),
    completed: zod_1.z.boolean().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
const BrainDumpSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    content: zod_1.z.string(),
    processed: zod_1.z.boolean(),
    nodes: zod_1.z.array(NodeSchema).optional(),
    createdAt: zod_1.z.string(),
});
// Create the Brain Space MCP server
exports.brainSpaceMCPServer = (0, genkitx_mcp_1.mcpServer)({
    name: 'brain-space-mcp',
    version: '1.0.0',
    description: 'Model Context Protocol server for Brain Space data',
    // Define available resources
    resources: [
        {
            uri: 'brainspace://nodes',
            name: 'Brain Space Nodes',
            description: 'Access to all user nodes (tasks, ideas, questions, etc.)',
            mimeType: 'application/json',
        },
        {
            uri: 'brainspace://braindumps',
            name: 'Brain Dumps',
            description: 'Access to brain dump entries',
            mimeType: 'application/json',
        },
        {
            uri: 'brainspace://routines',
            name: 'Routines',
            description: 'Access to user routines and habits',
            mimeType: 'application/json',
        },
    ],
    // Define available tools
    tools: [
        {
            name: 'searchNodes',
            description: 'Search for nodes by category, text, or date range',
            inputSchema: zod_1.z.object({
                userId: zod_1.z.string().describe('The user ID to search for'),
                category: zod_1.z.string().optional().describe('Filter by category'),
                searchText: zod_1.z.string().optional().describe('Search in node text'),
                startDate: zod_1.z.string().optional().describe('Start date for date range filter'),
                endDate: zod_1.z.string().optional().describe('End date for date range filter'),
                limit: zod_1.z.number().optional().default(10).describe('Maximum number of results'),
            }),
            execute: async (input) => {
                const db = admin.firestore();
                let query = db.collection('users').doc(input.userId).collection('nodes')
                    .orderBy('createdAt', 'desc');
                if (input.category) {
                    query = query.where('category', '==', input.category);
                }
                if (input.limit) {
                    query = query.limit(input.limit);
                }
                const snapshot = await query.get();
                const nodes = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                // Apply text search if provided
                if (input.searchText) {
                    const searchLower = input.searchText.toLowerCase();
                    return nodes.filter(node => { var _a; return (_a = node.text) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchLower); });
                }
                return nodes;
            },
        },
        {
            name: 'getRecentBrainDumps',
            description: 'Get recent brain dump entries',
            inputSchema: zod_1.z.object({
                userId: zod_1.z.string().describe('The user ID'),
                limit: zod_1.z.number().optional().default(5).describe('Number of brain dumps to retrieve'),
                includeNodes: zod_1.z.boolean().optional().default(false).describe('Include associated nodes'),
            }),
            execute: async (input) => {
                const db = admin.firestore();
                const snapshot = await db.collection('users')
                    .doc(input.userId)
                    .collection('brainDumps')
                    .orderBy('createdAt', 'desc')
                    .limit(input.limit)
                    .get();
                const brainDumps = [];
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    const brainDump = Object.assign({ id: doc.id }, data);
                    if (input.includeNodes && data.nodeIds) {
                        // Fetch associated nodes
                        const nodePromises = data.nodeIds.map((nodeId) => db.collection('users').doc(input.userId)
                            .collection('nodes').doc(nodeId).get());
                        const nodeDocs = await Promise.all(nodePromises);
                        brainDump.nodes = nodeDocs
                            .filter(doc => doc.exists)
                            .map(doc => (Object.assign({ id: doc.id }, doc.data())));
                    }
                    brainDumps.push(brainDump);
                }
                return brainDumps;
            },
        },
        {
            name: 'getNodeRelationships',
            description: 'Get relationships between nodes',
            inputSchema: zod_1.z.object({
                userId: zod_1.z.string().describe('The user ID'),
                nodeId: zod_1.z.string().describe('The node ID to find relationships for'),
            }),
            execute: async (input) => {
                const db = admin.firestore();
                // Get edges where this node is either source or target
                const [fromSnapshot, toSnapshot] = await Promise.all([
                    db.collection('users').doc(input.userId)
                        .collection('edges')
                        .where('from', '==', input.nodeId)
                        .get(),
                    db.collection('users').doc(input.userId)
                        .collection('edges')
                        .where('to', '==', input.nodeId)
                        .get()
                ]);
                const relationships = [
                    ...fromSnapshot.docs.map(doc => (Object.assign({ id: doc.id, direction: 'outgoing' }, doc.data()))),
                    ...toSnapshot.docs.map(doc => (Object.assign({ id: doc.id, direction: 'incoming' }, doc.data())))
                ];
                return relationships;
            },
        },
    ],
    // Define available prompts
    prompts: [
        {
            name: 'weeklyReview',
            description: 'Generate a weekly review based on completed nodes and brain dumps',
            arguments: [
                {
                    name: 'userId',
                    description: 'The user ID for the review',
                    required: true,
                },
            ],
            execute: async (args) => {
                const userId = args.userId;
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                // Fetch data for the weekly review
                const db = admin.firestore();
                const [nodesSnapshot, brainDumpsSnapshot] = await Promise.all([
                    db.collection('users').doc(userId)
                        .collection('nodes')
                        .where('createdAt', '>=', oneWeekAgo.toISOString())
                        .get(),
                    db.collection('users').doc(userId)
                        .collection('brainDumps')
                        .where('createdAt', '>=', oneWeekAgo.toISOString())
                        .get()
                ]);
                const nodes = nodesSnapshot.docs.map(doc => doc.data());
                const brainDumps = brainDumpsSnapshot.docs.map(doc => doc.data());
                // Group nodes by category
                const nodesByCategory = nodes.reduce((acc, node) => {
                    const category = node.category || 'misc';
                    if (!acc[category])
                        acc[category] = [];
                    acc[category].push(node);
                    return acc;
                }, {});
                // Create the prompt
                const prompt = `Generate a weekly review for the user based on the following activity:

## Nodes Created (${nodes.length} total)
${Object.entries(nodesByCategory).map(([category, categoryNodes]) => `### ${category} (${categoryNodes.length})
${categoryNodes.map(n => `- ${n.text}${n.completed ? ' ✓' : ''}`).join('\n')}`).join('\n\n')}

## Brain Dumps (${brainDumps.length} total)
${brainDumps.map(bd => `- "${bd.title || 'Untitled'}": ${bd.content.substring(0, 100)}...`).join('\n')}

Please provide:
1. A summary of accomplishments
2. Patterns or themes noticed
3. Suggestions for the upcoming week
4. Any items that need attention`;
                return {
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                };
            },
        },
    ],
    // Resource handlers
    getResource: async (uri) => {
        const url = new URL(uri);
        const userId = url.searchParams.get('userId');
        if (!userId) {
            throw new Error('userId parameter is required');
        }
        const db = admin.firestore();
        switch (url.pathname) {
            case '//nodes': {
                const snapshot = await db.collection('users')
                    .doc(userId)
                    .collection('nodes')
                    .orderBy('createdAt', 'desc')
                    .limit(100)
                    .get();
                const nodes = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(nodes, null, 2),
                        },
                    ],
                };
            }
            case '//braindumps': {
                const snapshot = await db.collection('users')
                    .doc(userId)
                    .collection('brainDumps')
                    .orderBy('createdAt', 'desc')
                    .limit(20)
                    .get();
                const brainDumps = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(brainDumps, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown resource: ${uri}`);
        }
    },
});
//# sourceMappingURL=mcp-server.js.map