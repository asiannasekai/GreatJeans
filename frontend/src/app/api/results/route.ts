import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    // In a real app, you'd fetch from a database
    // For now, we'll check if we have stored results
    const resultsDir = join(process.cwd(), 'results');
    const resultFile = join(resultsDir, `${analysisId}.json`);

    if (existsSync(resultFile)) {
      const resultData = await readFile(resultFile, 'utf-8');
      const result = JSON.parse(resultData);
      return NextResponse.json(result);
    }

    // If no stored result, return demo data
    return NextResponse.json({
      message: 'No stored results found, returning demo data',
      analysisId,
      // Return the same demo data structure
      qc: {
        format: 'Demo',
        n_snps: 450000,
        missing_pct: 0.03,
        allele_sanity: 0.97
      },
      protein: {
        alphafold_id: 'Q9Y6K8',
        mutations: [{
          position: 142,
          wild_type: 'V',
          mutant: 'I',
          confidence: 0.87
        }]
      },
      mini_model: {
        prediction: [0.2, 0.7, 0.1],
        confidence: 0.85,
        window: {
          center: 142,
          length: 21
        }
      },
      pgs: {
        BMI: {
          score: 0.3,
          percentile: 65,
          trait: 'Body Mass Index'
        }
      },
      disclaimer: 'This is demo data for illustration purposes.'
    });

  } catch (error) {
    console.error('Results retrieval error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
