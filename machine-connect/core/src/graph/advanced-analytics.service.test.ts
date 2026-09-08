import { AdvancedAnalyticsService } from './advanced-analytics.service';

test('pageRank clamps unsafe parameters', async () => {
  const calls: any[] = [];
  const db = { request: async (_path: string, options: any) => { calls.push(JSON.parse(options.body)); return []; } } as any;
  const service = new AdvancedAnalyticsService(db);
  await service.pageRank('org', 1000, 4);
  expect(calls[0]).toEqual({ p_org_id: 'org', iterations: 100, damping: 0.99 });
});

test('shortestPath clamps maximum depth', async () => {
  const calls: any[] = [];
  const db = { request: async (_path: string, options: any) => { calls.push(JSON.parse(options.body)); return []; } } as any;
  const service = new AdvancedAnalyticsService(db);
  await service.shortestPath('org', 'a', 'b', 1000);
  expect(calls[0].p_max_depth).toBe(100);
});
