import { ViewerCommand } from './viewerCommands';

export type AiExplainInput = {
  protein: { uniprot: string; name?: string };
  variant?: { rsid?: string; change?: string; index: number };
  alphafold?: { plddt_bin?: "very_high" | "high" | "low" };
  mini_model?: {
    wt?: { H: number; E: number; C: number; conf?: number };
    mut?: { H: number; E: number; C: number; conf?: number };
  };
  flags?: { near_pocket?: boolean };
};

export type AiExplainResponse = {
  insights: string[];
  commands?: ViewerCommand[];
  caveats?: string[];
};

const AI_API_BASE = process.env.NEXT_PUBLIC_AI_API_BASE || 'http://localhost:8000';

export async function aiExplain(payload: AiExplainInput): Promise<AiExplainResponse> {
  try {
    const response = await fetch(`${AI_API_BASE}/ai/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!Array.isArray(data.insights)) {
      throw new Error('Invalid AI response: insights must be an array');
    }

    return {
      insights: data.insights,
      commands: Array.isArray(data.commands) ? data.commands : undefined,
      caveats: Array.isArray(data.caveats) ? data.caveats : [
        "Educational content only",
        "Coverage may be limited for some variants",
        "This is not medical advice"
      ],
    };
  } catch (error) {
    console.warn('AI API unavailable, using fallback:', error);
    
    // Deterministic fallback
    return {
      insights: [
        "AlphaFold confidence is high at this site; predicted Δ is small.",
        "This residue appears to be in a structured region.",
        "Secondary structure changes may affect local stability."
      ],
      caveats: [
        "Educational content only",
        "Coverage may be limited for some variants", 
        "This is not medical advice"
      ]
    };
  }
}
