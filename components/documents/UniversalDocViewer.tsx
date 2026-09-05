'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Check,
  X
} from '@/components/ui/Icon';

interface UniversalDocViewerProps {
  url: string;
  fileName?: string;
  contentType?: string;
  title?: string;
  onDownload?: () => void;
}

declare global {
  interface Window {
    XLSX?: any;
    mammoth?: any;
  }
}

// Script loader helper with CDN fallbacks and caching
function loadExternalScript(src: string, globalVar: string, fallbackSrc?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }
    if ((window as any)[globalVar]) {
      return resolve((window as any)[globalVar]);
    }

    const existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
    if (existingScript) {
      if ((window as any)[globalVar]) return resolve((window as any)[globalVar]);
      existingScript.addEventListener('load', () => resolve((window as any)[globalVar]));
      existingScript.addEventListener('error', () => {
        if (fallbackSrc) {
          loadScriptTag(fallbackSrc, globalVar).then(resolve).catch(reject);
        } else {
          reject(new Error(`Failed to load ${src}`));
        }
      });
      return;
    }

    loadScriptTag(src, globalVar)
      .then(resolve)
      .catch((err) => {
        if (fallbackSrc) {
          loadScriptTag(fallbackSrc, globalVar).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
  });
}

function loadScriptTag(src: string, globalVar: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      if ((window as any)[globalVar]) {
        resolve((window as any)[globalVar]);
      } else {
        setTimeout(() => {
          if ((window as any)[globalVar]) {
            resolve((window as any)[globalVar]);
          } else {
            resolve((window as any)[globalVar] || true);
          }
        }, 100);
      }
    };
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
}

export function UniversalDocViewer({
  url,
  fileName = '',
  contentType = '',
  title = '',
  onDownload,
}: UniversalDocViewerProps) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  
  // Detect file category
  const isPdf = ext === 'pdf' || contentType.includes('pdf');
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext) || contentType.includes('image');
  const isExcel = ['xlsx', 'xls', 'csv'].includes(ext) || contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('csv');
  const isDocx = ['docx', 'doc'].includes(ext) || contentType.includes('wordprocessingml') || contentType.includes('msword');
  const isText = ['txt', 'json', 'log', 'md', 'xml', 'sql'].includes(ext) || (contentType.includes('text') && !isExcel);

  // Common UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Excel State
  const [workbookSheets, setWorkbookSheets] = useState<string[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [excelSearch, setExcelSearch] = useState('');
  const [rawWorkbook, setRawWorkbook] = useState<any>(null);

  // Docx State
  const [docHtml, setDocHtml] = useState<string>('');
  const [docFontSize, setDocFontSize] = useState<number>(15);
  const [docWordCount, setDocWordCount] = useState<number>(0);

  // Image State
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [isCheckerboard, setIsCheckerboard] = useState(false);

  // Text State
  const [textContent, setTextContent] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Load and Parse Document Binary / Data
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    async function parseDocument() {
      try {
        // 1. PDF
        if (isPdf) {
          setLoading(false);
          return;
        }

        // 2. Images
        if (isImage) {
          setLoading(false);
          return;
        }

        // Fetch ArrayBuffer for Office & Text parsing
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch file binary (HTTP ${res.status})`);
        }
        const arrayBuffer = await res.arrayBuffer();
        if (!active) return;

        // 3. EXCEL (.xlsx, .xls, .csv)
        if (isExcel) {
          try {
            // Load SheetJS
            const XLSX = await loadExternalScript(
              'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
              'XLSX',
              'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
            );

            if (!active) return;
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            setRawWorkbook(wb);
            setWorkbookSheets(wb.SheetNames || []);

            if (wb.SheetNames && wb.SheetNames.length > 0) {
              const firstSheet = wb.Sheets[wb.SheetNames[0]];
              const parsedRows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
              setSheetData(parsedRows);
            }
            setLoading(false);
          } catch (excelErr: any) {
            // Fallback for CSV if SheetJS fails
            if (ext === 'csv') {
              const textDecoder = new TextDecoder('utf-8');
              const text = textDecoder.decode(arrayBuffer);
              const lines = text.split(/\r?\n/).map((line) => line.split(','));
              setWorkbookSheets(['Sheet 1 (CSV)']);
              setSheetData(lines);
              setLoading(false);
              return;
            }
            throw new Error(`Unable to parse spreadsheet (${excelErr.message || 'Corrupted or unsupported format'}). You can download the file to view.`);
          }
          return;
        }

        // 4. DOCX (.docx)
        if (isDocx) {
          if (ext === 'doc') {
            // Legacy .doc format notice
            const textDecoder = new TextDecoder('utf-8');
            const text = textDecoder.decode(arrayBuffer);
            const cleanText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ');
            setDocHtml(`<div class="p-4 bg-amber-50 rounded-lg text-amber-900 mb-4 text-xs font-medium">Notice: Legacy .DOC format detected. Formatted preview is generated from available text streams. Download file for exact Microsoft Word layout.</div><p class="whitespace-pre-wrap">${cleanText.slice(0, 3000)}</p>`);
            setLoading(false);
            return;
          }

          try {
            const mammoth = await loadExternalScript(
              'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js',
              'mammoth',
              'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js'
            );

            if (!active) return;
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setDocHtml(result.value || '<p class="text-slate-400 italic">Empty Word Document</p>');
            
            // Calculate word count
            const text = (result.value || '').replace(/<[^>]*>/g, ' ');
            const words = text.trim().split(/\s+/).filter(Boolean).length;
            setDocWordCount(words);
            setLoading(false);
          } catch (docErr: any) {
            throw new Error(`Unable to render Word Document preview (${docErr.message || 'Formatting error'}). You can download the file to view.`);
          }
          return;
        }

        // 5. TEXT / JSON / LOGS
        if (isText) {
          const textDecoder = new TextDecoder('utf-8');
          const text = textDecoder.decode(arrayBuffer);
          setTextContent(text);
          setLoading(false);
          return;
        }

        // Unknown binary
        setLoading(false);
      } catch (err: any) {
        if (!active) return;
        setError(err.message || 'Failed to render document preview.');
        setLoading(false);
      }
    }

    parseDocument();

    return () => {
      active = false;
    };
  }, [url, ext, contentType]);

  // Switch Excel Sheet Tab
  const handleSelectSheet = (sheetIndex: number) => {
    if (!rawWorkbook || !rawWorkbook.SheetNames[sheetIndex]) return;
    setActiveSheetIndex(sheetIndex);
    const sheetName = rawWorkbook.SheetNames[sheetIndex];
    const targetSheet = rawWorkbook.Sheets[sheetName];
    if (window.XLSX) {
      const rows: any[][] = window.XLSX.utils.sheet_to_json(targetSheet, { header: 1, defval: '' });
      setSheetData(rows);
    }
  };

  // Filter Excel Rows based on Search
  const filteredRows = React.useMemo(() => {
    if (!excelSearch.trim()) return sheetData;
    const query = excelSearch.toLowerCase();
    return sheetData.filter((row, idx) => {
      if (idx === 0) return true; // keep header row
      return row.some((cell) => String(cell || '').toLowerCase().includes(query));
    });
  }, [sheetData, excelSearch]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper column letter converter (0 -> A, 1 -> B, 26 -> AA)
  const getColLetter = (index: number): string => {
    let letter = '';
    let num = index;
    while (num >= 0) {
      letter = String.fromCharCode((num % 26) + 65) + letter;
      num = Math.floor(num / 26) - 1;
    }
    return letter;
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 rounded-xl overflow-hidden relative">
      {/* ─── 1. LOADING STATE ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
          <div className="w-10 h-10 border-4 border-[#0f365e] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-extrabold text-slate-800">Rendering Document Preview...</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isExcel ? 'Parsing Spreadsheet Sheets & Cells' : isDocx ? 'Formatting Word Typography & Layout' : 'Loading document stream'}
          </p>
        </div>
      )}

      {/* ─── 2. ERROR STATE ────────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center p-8 space-y-3 max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-900">Preview Notice</p>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
            <div className="flex items-center justify-center gap-2 pt-3">
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Original Document</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. PDF VIEWER ─────────────────────────────────────────────────────────── */}
      {!loading && !error && isPdf && (
        <div className="flex-1 flex flex-col w-full h-full bg-slate-900/5 relative">
          <iframe
            src={`${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
            className="w-full flex-1 border-0 bg-white"
            title={title || 'PDF Document Viewer'}
          />
        </div>
      )}

      {/* ─── 4. EXCEL VIEWER (.xlsx, .xls, .csv) ───────────────────────────────────── */}
      {!loading && !error && isExcel && (
        <div className="flex-1 flex flex-col w-full h-full bg-white overflow-hidden">
          {/* Excel Toolbar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={excelSearch}
                  onChange={(e) => setExcelSearch(e.target.value)}
                  placeholder="Filter or search in sheet rows..."
                  className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-[#0f365e] focus:border-[#0f365e]"
                />
              </div>
              {excelSearch && (
                <button
                  onClick={() => setExcelSearch('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200">
                Excel Spreadsheet
              </span>
              <span>•</span>
              <span>
                {filteredRows.length > 0 ? filteredRows.length - 1 : 0} Data Rows
                {filteredRows.length > 0 && ` × ${filteredRows[0]?.length || 0} Columns`}
              </span>
            </div>
          </div>

          {/* Spreadsheet Data Grid */}
          <div className="flex-1 overflow-auto bg-slate-100/50 p-2 font-mono text-xs">
            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                <p className="font-bold text-sm text-slate-700">No matching cells or empty sheet</p>
                <p className="text-xs mt-1">Try clearing your search query or selecting another sheet tab below.</p>
              </div>
            ) : (
              <div className="inline-block min-w-full bg-white rounded-lg border border-slate-300 shadow-2xs overflow-hidden">
                <table className="min-w-full border-collapse text-left select-text">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="w-12 px-2 py-1.5 text-center text-[10px] font-bold text-slate-400 border-r border-slate-300 bg-slate-200/60 sticky top-0 left-0 z-20">
                        #
                      </th>
                      {filteredRows[0]?.map((_, colIdx) => (
                        <th
                          key={colIdx}
                          className="px-3 py-1.5 text-center text-[11px] font-bold text-slate-700 border-r border-slate-300 bg-slate-100 sticky top-0 z-10 select-none whitespace-nowrap min-w-[120px]"
                        >
                          <span className="text-[10px] text-slate-400 block font-normal">{getColLetter(colIdx)}</span>
                          <span className="truncate font-bold text-slate-900">
                            {filteredRows[0][colIdx] !== undefined && filteredRows[0][colIdx] !== ''
                              ? String(filteredRows[0][colIdx])
                              : `Column ${getColLetter(colIdx)}`}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.slice(1).map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={`border-b border-slate-200 hover:bg-sky-50/60 transition-colors ${
                          rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        <td className="px-2 py-1.5 text-center text-[10px] font-bold text-slate-400 border-r border-slate-300 bg-slate-50 sticky left-0 z-5 select-none font-mono">
                          {rowIdx + 1}
                        </td>
                        {filteredRows[0]?.map((_, colIdx) => {
                          const val = row[colIdx];
                          const strVal = val !== undefined && val !== null ? String(val) : '';
                          const isMatch = excelSearch && strVal.toLowerCase().includes(excelSearch.toLowerCase());

                          return (
                            <td
                              key={colIdx}
                              className={`px-3 py-1.5 text-xs text-slate-800 border-r border-slate-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs ${
                                isMatch ? 'bg-amber-100 font-bold text-amber-900' : ''
                              }`}
                              title={strVal}
                            >
                              {strVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Excel Sheet Tabs Navigation (Bottom bar) */}
          {workbookSheets.length > 0 && (
            <div className="px-3 py-2 bg-slate-200 border-t border-slate-300 flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mr-2 shrink-0">
                Worksheets:
              </span>
              {workbookSheets.map((name, idx) => (
                <button
                  key={name}
                  onClick={() => handleSelectSheet(idx)}
                  className={`px-3 py-1 rounded-md font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSheetIndex === idx
                      ? 'bg-white text-emerald-800 shadow-2xs border border-slate-300 border-b-2 border-b-emerald-600'
                      : 'bg-slate-100 hover:bg-white text-slate-600 border border-transparent'
                  }`}
                >
                  <FileText className="w-3 h-3 text-emerald-600" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 5. WORD DOCUMENT VIEWER (.docx, .doc) ─────────────────────────────────── */}
      {!loading && !error && isDocx && (
        <div className="flex-1 flex flex-col w-full h-full bg-slate-200/70 overflow-hidden">
          {/* Word Document Toolbar */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md border border-blue-200 text-[11px]">
                Word Document
              </span>
              {docWordCount > 0 && (
                <span className="text-slate-500 text-[11px] font-medium">
                  • {docWordCount} words (~{Math.ceil(docWordCount / 200)} min read)
                </span>
              )}
            </div>

            {/* Font size zoom controls */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setDocFontSize((prev) => Math.max(12, prev - 1))}
                className="p-1 hover:bg-white text-slate-700 rounded transition-colors cursor-pointer"
                title="Decrease font size"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-bold text-slate-700">{docFontSize}px</span>
              <button
                onClick={() => setDocFontSize((prev) => Math.min(24, prev + 1))}
                className="p-1 hover:bg-white text-slate-700 rounded transition-colors cursor-pointer"
                title="Increase font size"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Word Paper Page Reading Layout */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
            <div
              className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-slate-200 p-8 md:p-12 prose prose-slate max-w-none text-slate-800 leading-relaxed transition-all"
              style={{ fontSize: `${docFontSize}px` }}
              dangerouslySetInnerHTML={{ __html: docHtml }}
            />
          </div>
        </div>
      )}

      {/* ─── 6. IMAGE VIEWER (.png, .jpg, .jpeg, .webp, .svg) ──────────────────────── */}
      {!loading && !error && isImage && (
        <div className="flex-1 flex flex-col w-full h-full bg-slate-900/5 overflow-hidden">
          {/* Image Toolbar */}
          <div className="px-4 py-2 bg-white/90 backdrop-blur-xs border-b border-slate-200 flex items-center justify-between text-xs z-10">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              {ext.toUpperCase()} Image Preview
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setImageZoom((prev) => Math.max(0.25, prev - 0.25))}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-bold text-slate-800">{Math.round(imageZoom * 100)}%</span>
              <button
                onClick={() => setImageZoom((prev) => Math.min(4, prev + 0.25))}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setImageZoom(1);
                  setImageRotation(0);
                }}
                className="px-2 py-1 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                title="Reset zoom"
              >
                Reset
              </button>
              <button
                onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Image Canvas */}
          <div
            className={`flex-1 overflow-auto flex items-center justify-center p-6 ${
              isCheckerboard ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]' : 'bg-slate-900/10'
            }`}
          >
            <img
              src={url}
              alt={title || 'Document Preview'}
              className="max-h-full max-w-full object-contain rounded-lg shadow-xl bg-white transition-transform duration-200"
              style={{
                transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
              }}
            />
          </div>
        </div>
      )}

      {/* ─── 7. TEXT / CODE VIEWER (.txt, .json, .log, .md) ────────────────────────── */}
      {!loading && !error && isText && (
        <div className="flex-1 flex flex-col w-full h-full bg-slate-900 text-slate-100 overflow-hidden">
          <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              {fileName || 'Plain Text Document'} • {textContent.length} characters
            </span>
            <button
              onClick={() => copyToClipboard(textContent)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text">
            {textContent}
          </div>
        </div>
      )}

      {/* ─── 8. UNKNOWN FILE FALLBACK ──────────────────────────────────────────────── */}
      {!loading && !error && !isPdf && !isExcel && !isDocx && !isImage && !isText && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center p-8 space-y-3 max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#0f365e]/10 text-[#0f365e] flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-extrabold text-slate-900">{title || fileName || 'Document File'}</p>
            <p className="text-xs text-slate-500">
              File type: <span className="uppercase font-bold text-slate-700">{ext || 'Binary'}</span>. You can download and open this file in your native applications.
            </p>
            <div className="pt-2">
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="px-5 py-2.5 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
