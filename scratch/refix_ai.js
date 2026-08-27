const fs = require('fs');

let openRouter = fs.readFileSync('apps/api/src/services/ai/openRouterProvider.ts', 'utf8');
openRouter = openRouter.replace(/const b = body as any;/g, "const b = body as Record<string, unknown>;");
openRouter = openRouter.replace(/b\.error\?\.message/g, "(b.error as any)?.message");
openRouter = openRouter.replace(/\(b\.error as any\)\?\.message/g, "(b.error as { message?: string })?.message");
openRouter = openRouter.replace(/b\.usage\?\.prompt_tokens/g, "(b.usage as { prompt_tokens?: number })?.prompt_tokens");
openRouter = openRouter.replace(/b\.usage\?\.completion_tokens/g, "(b.usage as { completion_tokens?: number })?.completion_tokens");
openRouter = openRouter.replace(/b\.usage\?\.total_tokens/g, "(b.usage as { total_tokens?: number })?.total_tokens");
fs.writeFileSync('apps/api/src/services/ai/openRouterProvider.ts', openRouter);

let bridge = fs.readFileSync('apps/api/src/services/ai/searchIntentBridge.ts', 'utf8');
bridge = bridge.replace(/const c = client as any;/g, "const c = client as unknown;");
bridge = bridge.replace(/c\.users/g, "(c as { users: unknown }).users");
fs.writeFileSync('apps/api/src/services/ai/searchIntentBridge.ts', bridge);
