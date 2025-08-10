/**
 * API client for GreatJeans backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const EXPLAINER_BASE_URL = process.env.NEXT_PUBLIC_EXPLAINER_URL || 'http://localhost:8001';

export interface UploadResponse {
  upload_id: string;
  format?: string;
}

export interface AnalyzeRequest {
  upload_id: string;
  run_traits?: boolean;
  run_protein?: boolean;
  run_pgs?: boolean;
  target_rsid?: string;
}

export interface ResultJSON {
  qc: {
    format: string;
    n_snps: number;
    missing_pct: number;
    allele_sanity: number;
  };
  genome_window: {
    chrom: string;
    start: number;
    end: number;
    rsid: string;
  };
  variants: Array<{
    rsid: string;
    chrom: string;
    pos: number;
    genotype: string;
    gene?: string;
    consequence?: string;
    links: Record<string, string>;
  }>;
  traits: Array<{
    trait: string;
    rsid: string;
    effect_allele: string;
    your_genotype?: string;
    status: string;
    source_url?: string;
  }>;
  protein?: {
    uniprot: string;
    alphafold_cif_url: string;
    residues: Array<{
      rsid: string;
      index: number;
      protein_change?: string;
    }>;
  };
  pgs?: Record<string, {
    z: number;
    percentile: number;
    pgs_id: string;
    note: string;
  }>;
  ai_summary: {
    paragraph: string;
    caveats: string[];
  };
  mini_model?: {
    window: {
      center: number;
      length: number;
    };
    [key: string]: any;
  };
  disclaimer?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  url: string, 
  options: RequestInit = {},
  baseUrl: string = API_BASE_URL
): Promise<T> {
  const fullUrl = `${baseUrl}${url}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(response.status, errorData.message || 'Request failed', errorData);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new ApiError(response.status, errorData.message || 'Upload failed', errorData);
  }

  return await response.json();
}

export const api = {
  // Upload endpoints
  upload: uploadFile,

  // Analysis endpoints
  analyze: (request: AnalyzeRequest): Promise<ResultJSON> =>
    apiRequest('/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  // Demo endpoint
  getDemo: (): Promise<ResultJSON> =>
    apiRequest('/demo/na12878'),

  // Delete endpoint
  deleteUpload: (uploadId: string): Promise<{ status: string; upload_id: string }> =>
    apiRequest(`/uploads/${uploadId}`, {
      method: 'DELETE',
    }),

  // Health check
  health: (): Promise<{ ok: boolean }> =>
    apiRequest('/health'),

  // Version info
  version: (): Promise<{ version: string; catalogs: Record<string, string> }> =>
    apiRequest('/version'),

  // AI endpoints
  aiExample: (): Promise<any> =>
    apiRequest('/ai/example'),

  aiExplain: (data: {
    variants: any[];
    traits: any[];
    protein?: any;
  }): Promise<{ paragraph: string; caveats: string[] }> =>
    apiRequest('/ai/explain', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Protein endpoints
  proteinWindow: (rsid: string): Promise<{
    wt_seq: string;
    mut_seq: string;
    center: number;
    length: number;
  }> =>
    apiRequest('/protein/window', {
      method: 'POST',
      body: JSON.stringify({ rsid }),
    }),

  // Secondary structure prediction
  ssPredict: (data: {
    wt_seq: string;
    mut_seq: string;
    center?: number;
  }): Promise<any> =>
    apiRequest('/model/ss_predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Explainer API (separate service)
export const explainerApi = {
  health: (): Promise<{ ok: boolean }> =>
    apiRequest('/health', {}, EXPLAINER_BASE_URL),

  explain: (data: any): Promise<{ explanation: string }> =>
    apiRequest('/explain', {
      method: 'POST',
      body: JSON.stringify(data),
    }, EXPLAINER_BASE_URL),
};

export { ApiError };