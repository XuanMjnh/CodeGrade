import React, { Children, cloneElement, isValidElement, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableBody } from './ui/table';
import { Button } from './ui/button';
import { t } from '../lib/locale';

/** React owns pagination; no DOM mutation observers or hidden rows outside React. */
export function DataTable({ children, paginate = true, pageSize = 20, ...props }) {
  const [page, setPage] = useState(1);
  const parts = Children.toArray(children);
  const body = parts.find((child) => isValidElement(child) && child.type === TableBody);
  const rows = body ? Children.toArray(body.props.children) : [];
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const active = paginate && rows.length > pageSize;
  return (
    <div className="min-w-0">
      <Table {...props}>
        {active
          ? parts.map((child) =>
              child === body
                ? cloneElement(body, {}, rows.slice((current - 1) * pageSize, current * pageSize))
                : child,
            )
          : children}
      </Table>
      {active && (
        <nav
          className="pagination flex items-center justify-end gap-2 border-t border-border/60 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground rounded-b-xl"
          aria-label={t('Phân trang')}
        >
          <Button
            variant="outline"
            size="sm"
            aria-label={t('Trang trước')}
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-border/80 bg-card text-foreground hover:bg-muted hover:text-action shadow-2xs transition-all disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="inline-flex items-center px-2.5 py-1 font-mono text-xs font-bold text-foreground bg-card border border-border/80 rounded-lg shadow-2xs">
            {current} / {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label={t('Trang sau')}
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-border/80 bg-card text-foreground hover:bg-muted hover:text-action shadow-2xs transition-all disabled:opacity-40"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </nav>
      )}
    </div>
  );
}
