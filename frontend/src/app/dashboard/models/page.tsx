'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Cpu,
  Search,
  Loader2,
  AlertCircle,
  Sparkles,
  Filter,
} from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/utils';

interface AIModel {
  id: string;
  owned_by: string;
  context_length: number | null;
  input_price: number | null;
  output_price: number | null;
  input_multiplier: number;
  output_multiplier: number;
  is_free: boolean;
}

function useModels() {
  return useQuery<AIModel[]>({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const res = await api.get('/models');
      return res.data.data ?? res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Provider colors
const providerColors: Record<string, string> = {
  anthropic: 'bg-amber-100 text-amber-800',
  openai: 'bg-green-100 text-green-800',
  google: 'bg-blue-100 text-blue-800',
  deepseek: 'bg-royal-blue/10 text-royal-blue',
  xai: 'bg-beige text-washed-black',
  minimax: 'bg-purple-100 text-purple-800',
  nvidia: 'bg-emerald-100 text-emerald-800',
  qwen: 'bg-cyan-100 text-cyan-800',
  moonshotai: 'bg-yellow-100 text-yellow-800',
  'z-ai': 'bg-rose-100 text-rose-800',
  zai: 'bg-rose-100 text-rose-800',
  'arcee-ai': 'bg-teal-100 text-teal-800',
  poolside: 'bg-sky-100 text-sky-800',
};

function getProviderColor(provider: string): string {
  return providerColors[provider] || 'bg-beige text-washed-black/80';
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '-';
  if (price === 0) return 'Free';
  return `$${price.toFixed(2)}`;
}

export default function ModelsPage() {
  const { data: models, isLoading, error } = useModels();
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'input_price' | 'output_price' | 'context'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get unique providers
  const providers = useMemo(() => {
    if (!models) return [];
    const unique = [...new Set(models.map((m) => m.owned_by))].sort();
    return unique;
  }, [models]);

  // Filter and sort
  const filteredModels = useMemo(() => {
    if (!models) return [];
    let filtered = models;

    // Search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) => m.id.toLowerCase().includes(q) || m.owned_by.toLowerCase().includes(q)
      );
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter((m) => m.owned_by === providerFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.id.localeCompare(b.id);
          break;
        case 'input_price':
          cmp = (a.input_price ?? 999) - (b.input_price ?? 999);
          break;
        case 'output_price':
          cmp = (a.output_price ?? 999) - (b.output_price ?? 999);
          break;
        case 'context':
          cmp = (a.context_length ?? 0) - (b.context_length ?? 0);
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [models, search, providerFilter, sortBy, sortOrder]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const sortIcon = (col: typeof sortBy) => {
    if (sortBy !== col) return '';
    return sortOrder === 'asc' ? ' \u2191' : ' \u2193';
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-washed-black mb-2">Gagal Memuat Model</h2>
        <p className="text-dim-grey">Terjadi kesalahan saat mengambil daftar model AI.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-washed-black flex items-center gap-3">
          <Cpu className="h-7 w-7 text-royal-blue" />
          AI Models
        </h1>
        <p className="mt-1 text-dim-grey">
          Daftar model AI yang tersedia. Gunakan model ID saat membuat request ke API.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-mist" />
          <input
            type="text"
            placeholder="Cari model atau provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-silver-mist rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal-blue focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-silver-mist" />
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="border border-silver-mist rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-royal-blue bg-pure-white"
          >
            <option value="all">Semua Provider</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      {models && (
        <div className="flex items-center gap-4 mb-4 text-sm text-dim-grey">
          <span>{filteredModels.length} model ditemukan</span>
          {filteredModels.filter((m) => m.is_free).length > 0 && (
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-green-500" />
              {filteredModels.filter((m) => m.is_free).length} model gratis
            </span>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-royal-blue animate-spin" />
        </div>
      ) : (
        <div className="bg-pure-white rounded-2xl border border-washed-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-pearl border-b border-washed-black/10">
                  <th
                    onClick={() => handleSort('name')}
                    className="text-left px-6 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider cursor-pointer hover:text-washed-black/80 select-none"
                  >
                    Model{sortIcon('name')}
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider">
                    Provider
                  </th>
                  <th
                    onClick={() => handleSort('context')}
                    className="text-right px-6 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider cursor-pointer hover:text-washed-black/80 select-none"
                  >
                    Context Length{sortIcon('context')}
                  </th>
                  <th
                    onClick={() => handleSort('input_price')}
                    className="text-right px-6 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider cursor-pointer hover:text-washed-black/80 select-none"
                  >
                    Input Price{sortIcon('input_price')}
                  </th>
                  <th
                    onClick={() => handleSort('output_price')}
                    className="text-right px-6 py-4 text-xs font-semibold text-dim-grey uppercase tracking-wider cursor-pointer hover:text-washed-black/80 select-none"
                  >
                    Output Price{sortIcon('output_price')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredModels.map((model) => (
                  <tr
                    key={model.id}
                    className="hover:bg-pearl transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-washed-black text-sm font-mono">
                          {model.id.split('/').pop()}
                        </span>
                        {model.is_free && (
                          <Badge variant="success">Free</Badge>
                        )}
                      </div>
                      <span className="text-xs text-silver-mist font-mono">{model.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getProviderColor(model.owned_by)}`}
                      >
                        {model.owned_by}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-washed-black">
                        {model.context_length
                          ? formatNumber(model.context_length)
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-washed-black">
                        {formatPrice(model.input_price)}
                      </span>
                      {model.input_price !== null && model.input_price > 0 && (
                        <p className="text-xs text-silver-mist">/1M tokens</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-washed-black">
                        {formatPrice(model.output_price)}
                      </span>
                      {model.output_price !== null && model.output_price > 0 && (
                        <p className="text-xs text-silver-mist">/1M tokens</p>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredModels.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Cpu className="h-10 w-10 mx-auto text-concrete mb-3" />
                      <p className="text-silver-mist">
                        {search || providerFilter !== 'all'
                          ? 'Tidak ada model yang cocok dengan filter'
                          : 'Tidak ada model tersedia'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage hint */}
      <div className="mt-6 p-4 bg-royal-blue/10 rounded-xl">
        <h3 className="text-sm font-semibold text-royal-blue mb-2">Cara Menggunakan</h3>
        <p className="text-sm text-royal-blue">
          Gunakan <code className="px-1.5 py-0.5 bg-royal-blue/10 rounded text-xs font-mono">model ID</code> saat
          membuat request ke API. Contoh:
        </p>
        <pre className="mt-2 p-3 bg-[#0c0c0c] text-green-400 rounded-lg text-xs font-mono overflow-x-auto">
{`curl -X POST http://localhost:3001/v1/chat/completions \\
  -H "Authorization: Bearer llm_sk_YOUR_KEY" \\
  -d '{"model": "anthropic/claude-haiku-4-5", "messages": [...]}'`}
        </pre>
      </div>
    </div>
  );
}
