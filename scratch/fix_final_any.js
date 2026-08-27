const fs = require('fs');

const replacements = [
  ['next: any) => {', 'next: import("express").NextFunction) => {'],
  ['const events: any[] = [];', 'const events: Record<string, unknown>[] = [];'],
  ['let sortBy: any;', 'let sortBy: Record<string, "asc" | "desc">;'],
  ['function deriveInventorySummary(properties: any[]) {', 'function deriveInventorySummary(properties: Record<string, unknown>[]) {'],
  ['let activeTarget: any = null;', 'let activeTarget: Record<string, unknown> | null = null;'],
  ['const generateBasicSchema = (metrics: string[], hasChecklist = false): any[] => {', 'const generateBasicSchema = (metrics: string[], hasChecklist = false): Record<string, unknown>[] => {'],
  ['const schema: any[] = metrics.map((m) => ({', 'const schema: Record<string, unknown>[] = metrics.map((m) => ({'],
  ['targets_json: Record<string, any>, form_schema_json: any[]', 'targets_json: Record<string, unknown>, form_schema_json: Record<string, unknown>[]'],
  ['let empTarget: any = null;', 'let empTarget: Record<string, unknown> | null = null;'],
  ['let roleTarget: any = null;', 'let roleTarget: Record<string, unknown> | null = null;'],
  ['let targets: any[] = [];', 'let targets: Record<string, unknown>[] = [];'],
  ['let newTarget: any = null;', 'let newTarget: Record<string, unknown> | null = null;'],
  ['const b = body as any;', 'const b = body as Record<string, unknown>;'],
  ['prop: any,', 'prop: Record<string, unknown> | null,'],
  ['export function scoreAndSortPropertyRows(rows: any[], intent: SearchIntent): SearchMatchResult[] {', 'export function scoreAndSortPropertyRows(rows: Record<string, unknown>[], intent: import("@rrh-ems/shared").SearchIntent): import("./types").SearchMatchResult[] {'],
  ['const c = client as any;', 'const c = client as Record<string, unknown>;'],
  ['opportunity: { pipelineMetrics: any; conversionMetrics: any };', 'opportunity: { pipelineMetrics: Record<string, unknown>; conversionMetrics: Record<string, unknown> };'],
  ['const res: any = await p.$queryRaw', 'const res = (await p.$queryRaw'],
  ['const res: any =', 'const res ='],
  ['const pipelineCounts = allLeads.reduce((acc: any, lead: any) => {', 'const pipelineCounts = allLeads.reduce((acc: Record<string, number>, lead: Record<string, unknown>) => {'],
  ['const siteVisits = siteVisitsQuery.reduce((acc: any, item: any) => {', 'const siteVisits = siteVisitsQuery.reduce((acc: Record<string, number>, item: Record<string, unknown>) => {'],
  ['const teamPerformance: any[] = [];', 'const teamPerformance: Record<string, unknown>[] = [];'],
  ['const leadAttribution: any[] = [];', 'const leadAttribution: Record<string, unknown>[] = [];'],
  ['(p.property as any).findUnique', 'p.property.findUnique'],
  ['(p.property as any).update', 'p.property.update'],
  ['static async bulkUploadLeads(user: TokenPayload, rawLeads: any[]) {', 'static async bulkUploadLeads(user: TokenPayload, rawLeads: Record<string, unknown>[]) {'],
  ['opp as any', 'opp as Record<string, unknown>'],
  ['const bookingData: any = {', 'const bookingData: Record<string, unknown> = {'],
  ['(sum: number, r: any) => sum + (r.call_count || 0)', '(sum: number, r: Record<string, unknown>) => sum + (Number(r.call_count) || 0)'],
];

const lines = fs.readFileSync('scratch/remaining_any.txt', 'utf8').split(/\r?\n/);
let replacedFiles = 0;

for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(' -> ');
    const fileInfo = parts[0];
    const match = fileInfo.match(/(?:COLON|AS) ([^:]+):(\d+)/);
    if (!match) continue;
    const file = match[1];

    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    for (const [search, replace] of replacements) {
        if (content.includes(search)) {
            content = content.split(search).join(replace);
        }
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        replacedFiles++;
    }
}
console.log('Replaced in ' + replacedFiles + ' files.');
