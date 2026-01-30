import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { FilterState } from '@/types/events';

interface FilterPanelProps {
  open: boolean;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
}

export function FilterPanel({ open, filters, onApply, onClear }: FilterPanelProps) {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const update = useCallback(
    (key: keyof FilterState, value: string) => {
      const next = { ...localFilters, [key]: value };
      setLocalFilters(next);
      onApply(next);
    },
    [localFilters, onApply]
  );

  if (!open) return null;

  return (
    <div className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm border-2 border-[rgba(224,37,32,0.3)] rounded-2xl p-4 mb-6 shadow-lg animate-in slide-in-from-top-2 print:hidden">
      <h3 className="text-foreground font-extrabold text-lg uppercase tracking-wide mb-4">
        {t('filters.title')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Sport filter */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            {t('filters.sport')}
          </label>
          <Select value={localFilters.sport} onValueChange={(v) => update('sport', v)}>
            <SelectTrigger className="bg-white/5 border-[rgba(224,37,32,0.2)] text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a0f0f] border-[rgba(224,37,32,0.3)]">
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="football-men">{t('sports.footballMen')}</SelectItem>
              <SelectItem value="volleyball-men">{t('sports.volleyballMen')}</SelectItem>
              <SelectItem value="volleyball-women">{t('sports.volleyballWomen')}</SelectItem>
              <SelectItem value="meeting">{t('sports.meeting')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location filter */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            {t('filters.location')}
          </label>
          <Select value={localFilters.location} onValueChange={(v) => update('location', v)}>
            <SelectTrigger className="bg-white/5 border-[rgba(224,37,32,0.2)] text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a0f0f] border-[rgba(224,37,32,0.3)]">
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="home">{t('locations.home')}</SelectItem>
              <SelectItem value="away">{t('locations.away')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status filter */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            {t('filters.status')}
          </label>
          <Select value={localFilters.status} onValueChange={(v) => update('status', v)}>
            <SelectTrigger className="bg-white/5 border-[rgba(224,37,32,0.2)] text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a0f0f] border-[rgba(224,37,32,0.3)]">
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="played">{t('status.played')}</SelectItem>
              <SelectItem value="upcoming">{t('status.upcoming')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            {t('filters.searchOpponent')}
          </label>
          <Input
            placeholder={t('filters.searchPlaceholder')}
            value={localFilters.search}
            onChange={(e) => update('search', e.target.value)}
            className="bg-white/5 border-[rgba(224,37,32,0.2)] text-foreground placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex gap-3 border-t border-[rgba(224,37,32,0.2)] pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLocalFilters({ sport: 'all', location: 'all', status: 'all', search: '' });
            onClear();
          }}
          className="border-red-300/30 text-red-300 hover:bg-red-300/10 hover:border-red-300"
        >
          {t('filters.clearAll')}
        </Button>
      </div>
    </div>
  );
}
