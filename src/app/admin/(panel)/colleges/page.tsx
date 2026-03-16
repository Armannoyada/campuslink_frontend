'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Upload,
  Search,
  Trash2,
  Building2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  AlertCircle,
  Download,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { toast } from 'sonner';

interface College {
  id: string;
  name: string;
  shortName?: string;
  city?: string;
  state?: string;
  type?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface CollegesResponse {
  colleges: College[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

export default function AdminCollegesPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-colleges', page, search, stateFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      if (stateFilter) params.set('state', stateFilter);
      const res = await adminApi.get(`/admin/colleges?${params}`);
      return res.data.data as CollegesResponse;
    },
  });

  const { data: states } = useQuery({
    queryKey: ['admin-college-states'],
    queryFn: async () => {
      const res = await adminApi.get('/admin/colleges/states');
      return res.data.data as string[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/admin/colleges/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-colleges'] });
      toast.success('College deleted');
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete college'),
  });

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
        toast.error('Only .xlsx, .xls, or .csv files are supported');
        return;
      }

      setImporting(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await adminApi.post('/admin/colleges/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const result = res.data.data as ImportResult;
        setImportResult(result);
        qc.invalidateQueries({ queryKey: ['admin-colleges'] });
        qc.invalidateQueries({ queryKey: ['admin-college-states'] });
        toast.success(`Import complete — ${result.created} colleges added`);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Import failed';
        toast.error(msg);
      } finally {
        setImporting(false);
      }
    },
    [qc]
  );

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Colleges</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total.toLocaleString()} colleges total` : 'Manage college directory'}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              const res = await adminApi.get('/admin/colleges/sample', { responseType: 'blob' });
              const url = URL.createObjectURL(res.data as Blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'colleges_sample.xlsx';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={16} />
            Sample File
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="gap-2"
          >
            {importing ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Upload size={16} />
            )}
            Import Excel
          </Button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <Card className={importResult.errors > 0 ? 'border-amber-400' : 'border-green-400'}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {importResult.errors > 0 ? (
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              ) : (
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">
                  Import complete — {importResult.total} rows processed
                </p>
                <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="text-green-600 font-medium">
                    {importResult.created} added
                  </span>
                  {importResult.skipped > 0 && (
                    <span>{importResult.skipped} skipped</span>
                  )}
                  {importResult.errors > 0 && (
                    <span className="text-red-500">{importResult.errors} errors</span>
                  )}
                </div>
                {importResult.errorDetails.length > 0 && (
                  <ul className="mt-2 text-xs text-red-600 space-y-0.5">
                    {importResult.errorDetails.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setImportResult(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle size={16} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload hint */}
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          <FileSpreadsheet className="mx-auto text-muted-foreground mb-2" size={32} />
          <p className="text-sm font-medium text-foreground">
            Drop an Excel file or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong> — columns: College Name, Short Name, City/District Name, State Name, College Type
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 size={18} /> College Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search by name, city, state..."
                value={search}
                onChange={handleSearch}
                className="pl-9"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground min-w-40"
            >
              <option value="">All States</option>
              {states?.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
          ) : !data?.colleges.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="mx-auto mb-3 opacity-40" size={40} />
              <p>No colleges found</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Short</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.colleges.map((college) => (
                      <TableRow key={college.id}>
                        <TableCell className="font-medium max-w-55 truncate">
                          {college.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {college.shortName || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {college.city || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {college.state || '—'}
                        </TableCell>
                        <TableCell>
                          {college.type ? (
                            <Badge variant="secondary" className="text-xs">
                              {college.type}
                            </Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {college.isVerified ? (
                            <CheckCircle2 className="text-green-500" size={16} />
                          ) : (
                            <XCircle className="text-muted-foreground/50" size={16} />
                          )}
                        </TableCell>
                        <TableCell>
                          {deleteConfirm === college.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => deleteMutation.mutate(college.id)}
                                className="text-xs text-red-600 font-medium hover:underline"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs text-muted-foreground hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(college.id)}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <p className="text-muted-foreground">
                    Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, data.total)} of {data.total}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <span className="flex items-center px-3 text-foreground font-medium">
                      {page} / {data.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                      disabled={page === data.pages}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
