import React, { type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { EtfId } from '@/data/etfs';
const state = vi.hoisted(() => ({ ids: ['spy', 'ivv'] as [EtfId, EtfId], track: vi.fn(), trackOnce: vi.fn(), setIds: vi.fn() }));
vi.mock('react', async original => ({ ...await original<typeof import('react')>(), useRef: () => ({ current: false }), useState: (initial: unknown) => Array.isArray(initial) ? [state.ids, state.setIds] : [initial, vi.fn()] }));
vi.mock('@/lib/analytics/client', () => ({ track: state.track, trackOnce: state.trackOnce }));
vi.mock('@/components/lead-form/lead-form', () => ({ LeadForm: () => null }));
const { Workspace } = await import('@/components/comparison/workspace');
const { FundSelector } = await import('@/components/comparison/fund-selector');
beforeEach(() => { vi.stubGlobal('React', React); state.ids = ['spy', 'ivv']; vi.clearAllMocks(); });
afterEach(() => vi.unstubAllGlobals());
function selectors() {
 const found: ReactElement<{ onChange: (id: EtfId) => void }>[] = [];
 function visit(node: ReactNode) {
  if (Array.isArray(node)) { node.forEach(visit); return; }
  if (!React.isValidElement<{ children?: ReactNode }>(node)) return;
  if (node.type === FundSelector) found.push(node as ReactElement<{ onChange: (id: EtfId) => void }>);
  visit(node.props.children);
 }
 visit(Workspace({ attribution: { ad_variant: 'a' }, privacy: { name: 'TEST', contact: 'test@example.invalid', enabled: true } })); return found;
}
test.each([0, 1])('selector %i records the next ordered pair rather than stale state', index => {
 selectors()[index].props.onChange('cspx');
 expect(state.track).toHaveBeenCalledWith('etf_selected', index === 0 ? ['cspx', 'ivv'] : ['spy', 'cspx']);
 expect(state.trackOnce).toHaveBeenCalledWith('comparison_started');
});
test('duplicate selection updates the UI but emits no misleading pair', () => {
 selectors()[0].props.onChange('ivv');
 expect(state.setIds).toHaveBeenCalled(); expect(state.track).not.toHaveBeenCalled();
});
test('unchanged default comparison is not fabricated as a selection', () => {
 selectors(); expect(state.track).not.toHaveBeenCalled();
});
