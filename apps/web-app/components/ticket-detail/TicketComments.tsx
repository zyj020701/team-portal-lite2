'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import type { TicketComment } from '@team-portal/types';
import { useAddComment } from '../../hooks/use-ticket-detail';

interface TicketCommentsProps {
  ticketId: string;
  comments: TicketComment[];
}

export function TicketComments({ ticketId, comments }: TicketCommentsProps) {
  const t = useTranslations('detail');
  const format = useFormatter();
  const [content, setContent] = useState('');
  const addComment = useAddComment(ticketId);

  const sorted = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || addComment.isPending) return;
    await addComment.mutateAsync(trimmed);
    setContent('');
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('addNotePlaceholder')}
          rows={3}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 resize-y"
        />
        <div className="flex items-center justify-between">
          {addComment.isError && (
            <span className="text-sm text-error-700">{t('noteSubmitFailed')}</span>
          )}
          <button
            type="submit"
            disabled={!content.trim() || addComment.isPending}
            className="ml-auto px-4 py-1.5 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            {addComment.isPending ? t('submitting') : t('addNote')}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {sorted.length === 0 && <p className="text-sm text-neutral-500">{t('noNotes')}</p>}
        {sorted.map((comment) => (
          <div key={comment.id} className="border border-neutral-200 rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-neutral-800">{comment.author.name}</span>
              <span className="text-xs text-neutral-500">
                {format.dateTime(new Date(comment.createdAt), {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-neutral-800 whitespace-pre-wrap">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
