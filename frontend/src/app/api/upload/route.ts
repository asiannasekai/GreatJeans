import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { GenomicProcessor } from '../../../lib/genomic-processor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validExtensions = ['.vcf', '.txt', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload VCF, TXT, or CSV files.' 
      }, { status: 400 });
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 50MB.' 
      }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const analysisId = `analysis_${timestamp}`;
    const filename = `${analysisId}_${file.name}`;
    const filepath = join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, new Uint8Array(buffer));

    // Process the genomic file
    const processor = new GenomicProcessor();
    const analysisResult = await processor.processFile(filepath, file.name, fileExtension);

    // Store the result (in a real app, you'd save this to a database)
    // For now, we'll include it in the response
    
    return NextResponse.json({
      message: 'File uploaded and processed successfully',
      analysisId,
      filename: file.name,
      size: file.size,
      type: fileExtension,
      result: analysisResult
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during upload' 
    }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
