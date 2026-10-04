import type { Prospect } from '../types';

// Legacy/imported leads may be partial. Normalise only the UI copy, never rewrite stored records.
export function normalizeProspect(value: Partial<Prospect>): Prospect {
  const text = (v: unknown) => typeof v === 'string' ? v : '';
  return {
    ...value,
    id: text(value.id), companyName: text(value.companyName), ico: text(value.ico),
    website: text(value.website), companySize: text(value.companySize),
    industry: text(value.industry), region: text(value.region),
    targetDecisionMaker: text(value.targetDecisionMaker), directContact: text(value.directContact),
    identifiedWebSignals: Array.isArray(value.identifiedWebSignals) ? value.identifiedWebSignals.filter(v => typeof v === 'string') : [],
    valueProposition: text(value.valueProposition),
    coldOutreach: { subject: text(value.coldOutreach?.subject), body: text(value.coldOutreach?.body), language: text(value.coldOutreach?.language) },
    registers: { orsrUrl: text(value.registers?.orsrUrl), finstatUrl: text(value.registers?.finstatUrl), overitUrl: text(value.registers?.overitUrl) },
    status: value.status || 'new', auditTimestamp: text(value.auditTimestamp),
  };
}