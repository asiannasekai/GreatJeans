"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export default function UploadPage() {
  const router = useRouter();
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    error: null,
    success: false
  });

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const validExtensions = ['.vcf', '.txt', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please upload a valid genomic data file (.vcf, .txt, or .csv)',
        file: null
      }));
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadState(prev => ({
        ...prev,
        error: 'File size must be less than 50MB',
        file: null
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      file,
      error: null,
      success: false
    }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const uploadFile = async () => {
    if (!uploadState.file) return;

    setUploadState(prev => ({ ...prev, uploading: true, progress: 0, error: null }));

    try {
      const formData = new FormData();
      formData.append('file', uploadState.file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadState(prev => ({
        ...prev,
        progress: 100,
        success: true,
        uploading: false
      }));

      // Redirect to results after successful upload
      setTimeout(() => {
        router.push(`/results?id=${result.analysisId}`);
      }, 2000);

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        progress: 0
      }));
    }
  };

  const resetUpload = () => {
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      error: null,
      success: false
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Back Button */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Go back to home"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-xl font-semibold text-slate-900">
                Upload Genetic Data
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Upload Your Genomic Data
            </h2>
            <p className="text-slate-600">
              Upload VCF files, 23andMe data, or other genomic formats for comprehensive analysis
            </p>
          </div>

          {/* Upload Area */}
          {!uploadState.file && !uploadState.success && (
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-lg text-slate-600 mb-2">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Supports VCF, 23andMe TXT, and CSV formats (max 50MB)
              </p>
              <input
                id="file-input"
                type="file"
                accept=".vcf,.txt,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
              <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
                Choose File
              </button>
            </div>
          )}

          {/* File Selected */}
          {uploadState.file && !uploadState.uploading && !uploadState.success && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <FileText className="w-8 h-8 text-slate-600" />
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{uploadState.file.name}</h3>
                    <p className="text-sm text-slate-600">
                      {(uploadState.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={uploadFile}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Start Analysis
                </button>
                <button
                  onClick={resetUpload}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Uploading State */}
          {uploadState.uploading && (
            <div className="space-y-6">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Processing Your Data
                </h3>
                <p className="text-slate-600">
                  Analyzing your genomic data and generating insights...
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Progress</span>
                  <span>{uploadState.progress}%</span>
                </div>
                <div className="bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadState.success && (
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Analysis Complete!
                </h3>
                <p className="text-slate-600">
                  Redirecting to your results...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {uploadState.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-900">Upload Error</h4>
                  <p className="text-sm text-red-700">{uploadState.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Supported Formats Info */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="font-medium text-slate-900 mb-3">Supported Formats</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-600">VCF files (.vcf)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">23andMe data (.txt)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-slate-600">CSV files (.csv)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
