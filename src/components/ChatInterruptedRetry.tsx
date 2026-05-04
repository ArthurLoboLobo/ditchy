'use client';

import RefreshIcon from '@/components/ui/RefreshIcon';
import Spinner from '@/components/ui/Spinner';
import type { Translations } from '@/lib/i18n/pt-BR';

type ChatInterruptedRetryProps = {
  retrying: boolean;
  onRetry: () => void;
  t: Translations;
};

export default function ChatInterruptedRetry({ retrying, onRetry, t }: ChatInterruptedRetryProps) {
  return (
    <div className="flex justify-end -mt-6 mb-2 animate-fade-in-up">
      <div className="flex items-center gap-3 max-w-[85%]">
        <span className="font-body text-[14px] text-page-cream-muted">
          {t.chat.responseInterrupted}
        </span>
        <button
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] font-label text-[13px]
                     bg-transparent text-page-cream-muted hover:text-page-cream hover:bg-desk-surface-hover
                     disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {retrying ? <Spinner size={13} /> : <RefreshIcon size={13} />}
          {t.chat.tryAgain}
        </button>
      </div>
    </div>
  );
}
