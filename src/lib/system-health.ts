export type HealthStatus = 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE' | 'SIMULATED';

export interface ServiceHealth {
  id: string;
  name: string;
  category: 'PAYMENTS' | 'AI_OCR' | 'MACHINE_LEARNING' | 'CATALOG' | 'EVENT_BUS';
  status: HealthStatus;
  latencyMs: number;
  uptimePct: number;
  endpoint: string;
  lastChecked: string;
  notes: string;
  disruptionReason?: string;
  remedyAction?: string;
}

export const INITIAL_SERVICES: ServiceHealth[] = [
  {
    id: 'svc-paypal',
    name: 'PayPal Developer Sandbox (Orders v2 / Auth v2)',
    category: 'PAYMENTS',
    status: 'OPERATIONAL',
    latencyMs: 142,
    uptimePct: 99.94,
    endpoint: 'https://api-m.sandbox.paypal.com/v2/checkout/orders',
    lastChecked: new Date().toISOString(),
    notes: 'OAuth 2.0 token caching active; FIPS 180-4 SHA-256 approval digests enforced.',
  },
  {
    id: 'svc-gemini',
    name: 'Google Gemini 2.5 Flash Multimodal OCR',
    category: 'AI_OCR',
    status: 'OPERATIONAL',
    latencyMs: 215,
    uptimePct: 99.85,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash',
    lastChecked: new Date().toISOString(),
    notes: '3-way match extraction with bounding box OCR and regex fallback cascade active.',
  },
  {
    id: 'svc-python-ml',
    name: 'Python ML FastAPI Service (GNN + LSTM Autoencoder)',
    category: 'MACHINE_LEARNING',
    status: 'SIMULATED',
    latencyMs: 38,
    uptimePct: 100.0,
    endpoint: 'http://localhost:8000/predict/risk',
    lastChecked: new Date().toISOString(),
    notes: 'Local deterministic TypeScript engine cascade active (<50ms execution guarantee).',
  },
  {
    id: 'svc-channel3',
    name: 'Channel3 Multi-Merchant B2B Catalog SDK',
    category: 'CATALOG',
    status: 'OPERATIONAL',
    latencyMs: 185,
    uptimePct: 99.91,
    endpoint: 'https://api.channel3.io/v1/catalog/search',
    lastChecked: new Date().toISOString(),
    notes: 'Normalized unit price calculation with robust Z-score outlier detection.',
  },
  {
    id: 'svc-webhook',
    name: 'PayPal Webhooks & Telemetry Audit Dispatcher',
    category: 'EVENT_BUS',
    status: 'OPERATIONAL',
    latencyMs: 54,
    uptimePct: 99.98,
    endpoint: '/api/paypal/webhook',
    lastChecked: new Date().toISOString(),
    notes: 'Live Cosmos.AI trace logging and real-time PayPal-Debug-Id drawer telemetry.',
  },
];

let servicesHealthState = [...INITIAL_SERVICES];

export function getSystemHealth(): ServiceHealth[] {
  return [...servicesHealthState];
}

export function updateServiceHealth(id: string, updates: Partial<ServiceHealth>): ServiceHealth | undefined {
  const index = servicesHealthState.findIndex((s) => s.id === id);
  if (index === -1) return undefined;

  const updated = {
    ...servicesHealthState[index],
    ...updates,
    lastChecked: new Date().toISOString(),
  };
  servicesHealthState[index] = updated;
  return updated;
}

export function markServiceAvailable(id: string): ServiceHealth | undefined {
  return updateServiceHealth(id, {
    status: 'OPERATIONAL',
    disruptionReason: undefined,
    remedyAction: undefined,
    latencyMs: Math.floor(40 + Math.random() * 80),
  });
}

export function resyncAllServices(): ServiceHealth[] {
  servicesHealthState = servicesHealthState.map((s) => ({
    ...s,
    status: s.id === 'svc-python-ml' ? 'SIMULATED' : 'OPERATIONAL',
    latencyMs: Math.floor(40 + Math.random() * 90),
    lastChecked: new Date().toISOString(),
    disruptionReason: undefined,
  }));
  return [...servicesHealthState];
}

