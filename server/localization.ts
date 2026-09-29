import type { Request, Response, NextFunction } from 'express';
import { translator, translate, type Language } from '../src/i18n';
import type { Prospect } from '../src/types';

export const localeOf = (value: unknown): Language => value === 'en' ? 'en' : 'sk';
export function outputLanguageInstruction(value: unknown) {
  const name = localeOf(value) === 'en' ? 'English' : 'Slovak (professional formal address)';
  return `\nLOCALIZATION CONTRACT: Write ALL human-readable field values in ${name}, including companySize, industry, roles, contactType, every identifiedWebSignals entry, valueProposition, subject and body. Keep JSON keys and enum values unchanged. Preserve official company/person names, Slovak place names, business IDs, URLs, phone numbers and emails exactly. The selected language applies to the WHOLE result, not only the email draft. Never invent unverifiable contact details or findings; state when information is not verified.`;
}

// Only application messages are translated. Saved company data and user content are untouched.
export function localizeMessages(req: Request, res: Response, next: NextFunction) {
  const t = translator(localeOf(req.headers['x-ui-language'] || req.body?.language));
  const json = res.json.bind(res);
  res.json = ((body: any) => {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      body = { ...body };
      for (const field of ['error', 'message']) if (typeof body[field] === 'string') body[field] = t(body[field]);
    }
    return json(body);
  }) as Response['json'];
  next();
}

const sampleInsights: Record<string, { signals: string[]; offer: string }> = {
  'sk-smb-1': { signals: ['Enquiries use a static email address and a PDF form.', 'The project catalogue has no interactive budget enquiry tool.', 'Mobile pages lack direct click-to-call actions.', 'New tenders do not automatically notify the project manager.'], offer: 'A structured B2B enquiry form with preliminary capacity estimates and instant project-manager notifications.' },
  'sk-smb-2': { signals: ['CAD drawings arrive as email attachments, slowing technical checks.', 'There is no client portal for tracking manufacturing orders.', 'Service and equipment pricing is presented in an outdated format.', 'There is no validated upload flow for large technical drawings.'], offer: 'A secure CAD/STEP upload portal with estimated delivery times and CRM routing.' },
  'sk-smb-3': { signals: ['Emergency and routine HVAC servicing is requested by phone.', 'No annual maintenance calculator is available for commercial buildings.', 'Forms do not validate business IDs or refrigerant types.', 'Site visits cannot be scheduled online.'], offer: 'A B2B service scheduler with business-ID validation and immediate technician assignment.' },
  'sk-smb-4': { signals: ['Treatment prices are locked in a multi-page PDF.', 'No 24/7 booking is available for consultations or dental hygiene.', 'Patient document intake needs a secure upload process.', 'There are no appointment reminders.'], offer: 'An interactive treatment price calculator and online booking with appointment reminders.' },
  'sk-smb-5': { signals: ['Freight enquiries arrive as unstructured emails.', 'Customers cannot see available capacity on international routes.', 'Static pricing does not account for tonnage and tolls.', 'Senders do not receive automatic unloading notifications.'], offer: 'An interactive freight calculator with route-capacity checks and rapid quotations.' },
  'sk-smb-6': { signals: ['Building faults are reported through a central phone or email.', 'There is no client portal for property managers.', 'Customers cannot see upcoming mandatory inspections.', 'The mobile website lacks a quick emergency-service action.'], offer: 'A mobile service portal with photo uploads, technician notifications and job tracking.' },
  'sk-smb-7': { signals: ['The materials catalogue is available only as a large PDF.', 'Wholesale buyers have no dedicated ordering area.', 'Stock availability requires a phone call.', 'There is no online enquiry for bulk orders and site delivery.'], offer: 'A B2B wholesale ordering area with business-ID validation and project-pricing enquiries.' },
  'sk-smb-8': { signals: ['Customers cannot estimate monthly accounting fees online.', 'Documents are handed over in person or by email attachment.', 'There is no client area for VAT and tax deadlines.', 'No structured onboarding audit form is available.'], offer: 'An accounting fee calculator and secure document collection portal for business clients.' },
};

// These are authored English SAMPLE templates, not a translation engine for live or saved prose.
export function localizeSample(p: Prospect, language: unknown, sampleId?: string): Prospect {
  if (localeOf(language) !== 'en') return { ...p, isMock: true };
  const insights = sampleInsights[sampleId || ''] || {
    signals: ['Sample check: are enquiry forms structured?', 'Sample check: are prices accessible without downloading a PDF?', 'Sample check: is the mobile contact flow easy to use?'],
    offer: 'A structured B2B enquiry form with instant notifications and an optional pricing calculator.',
  };
  return {
    ...p, isMock: true,
    companySize: p.companySize.replace('zamestnancov', 'employees'),
    industry: translate('en', p.industry) === 'Všeobecné SMB' ? 'General SMB' : translate('en', p.industry),
    region: p.region === 'Slovensko (celoštátny trh)' ? 'Slovakia (nationwide)' : p.region,
    targetDecisionMaker: p.targetDecisionMaker.includes(' – ') ? `${p.targetDecisionMaker.split(' – ')[0]} – Company decision-maker (sample, unverified)` : 'Managing director (not verified)',
    directContact: 'Not verified — sample data', contactType: 'Sample contact',
    identifiedWebSignals: insights.signals, valueProposition: insights.offer,
  };
}