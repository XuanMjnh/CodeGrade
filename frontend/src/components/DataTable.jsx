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
          className="pagination flex items-center justify-end gap-3 border-t px-4 py-3 text-xs text-muted-foreground"
          aria-label={t('Phân trang')}
        >
          <span>
            {current} / {pages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('Trang trước')}
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('Trang sau')}
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}
