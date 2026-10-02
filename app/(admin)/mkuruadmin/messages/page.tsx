'use client';

import React from 'react';
import {
  Search as SearchIcon, Trash2, Mail, MessageCircle, Inbox,
  Check, Archive, Reply, StickyNote, Phone,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  Badge, Button, EmptyState, Field, Modal, Panel, SearchInput, Textarea,
} from '../components/ui';
import type { Message, MessageStatus } from '@/lib/types';
import { MESSAGE_STATUS, daysSince, formatDateTime } from '../lib/data';

const FILTERS: { value: MessageStatus | 'all' | 'inbox'; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
];

/** A contact is treated as a phone number when it has digits and no @ sign. */
function isPhone(contact: string) {
  return !contact.includes('@') && contact.replace(/\D/g, '').length >= 9;
}

const waLink = (contact: string) =>
  `https://wa.me/${contact.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, thanks for contacting Mkurugenzi —')}`;

export default function AdminMessagesPage() {
  const { messages, save, remove } = useAdmin();

  const [filter, setFilter] = React.useState<MessageStatus | 'all' | 'inbox'>('inbox');
  const [query, setQuery] = React.useState('');
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const open = messages.find((m) => m.id === openId) ?? null;

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: messages.length, inbox: 0, new: 0, read: 0, replied: 0, archived: 0 };
    for (const m of messages) {
      c[m.status] = (c[m.status] ?? 0) + 1;
      if (m.status !== 'archived') c.inbox += 1;
    }
    return c;
  }, [messages]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) => {
      if (filter === 'inbox' && m.status === 'archived') return false;
      if (filter !== 'inbox' && filter !== 'all' && m.status !== filter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.contact.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q)
      );
    });
  }, [messages, filter, query]);

  // Opening an untouched message counts as reading it.
  const openMessage = async (message: Message) => {
    setOpenId(message.id);
    setNotes(message.notes ?? '');
    if (message.status === 'new') {
      try {
        await save('messages', { ...message, status: 'read' });
      } catch {
        notify('Could not mark the message as read');
      }
    }
  };

  const setStatus = async (status: MessageStatus) => {
    if (!open) return;
    setBusy(true);
    try {
      await save('messages', { ...open, status, notes });
      notify(`Marked as ${MESSAGE_STATUS[status].label.toLowerCase()}`);
      if (status === 'archived') setOpenId(null);
    } catch {
      notify('Could not update the message');
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async () => {
    if (!open) return;
    setBusy(true);
    try {
      await save('messages', { ...open, notes });
      notify('Note saved');
    } catch {
      notify('Could not save the note');
    } finally {
      setBusy(false);
    }
  };

  const destroy = async () => {
    if (!open) return;
    setBusy(true);
    try {
      await remove('messages', open.id);
      setOpenId(null);
      notify('Message deleted');
    } catch {
      notify('Could not delete the message');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full bg-[#0d0d0d] text-white text-sm shadow-[0_18px_40px_-20px_rgba(0,0,0,0.5)]">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-heading text-3xl sm:text-4xl">Messages</h1>
          <p className="text-sm text-black/50 mt-1">
            {counts.inbox} in the inbox &middot; {counts.new ?? 0} unread &middot; {messages.length} total
          </p>
        </div>
        <a href="/contact" target="_blank" rel="noreferrer">
          <Button variant="light">
            <MessageCircle className="w-4 h-4" /> View the contact page
          </Button>
        </a>
      </div>

      <Panel>
        <div className="space-y-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, contact, subject" />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all ${
                  filter === f.value
                    ? 'bg-[#0d0d0d] text-white border-[#0d0d0d]'
                    : 'bg-white text-black/50 border-black/10 hover:border-black/30'
                }`}
              >
                {f.label}
                <span className="ml-1.5 opacity-60">{counts[f.value] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel>
          <EmptyState
            icon={messages.length ? SearchIcon : Inbox}
            title={messages.length ? 'No messages match' : 'No messages yet'}
            sub={
              messages.length
                ? 'Try another search or filter.'
                : 'Enquiries sent through the contact form land here.'
            }
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const meta = MESSAGE_STATUS[m.status];
            const age = daysSince(m.createdAt);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => void openMessage(m)}
                className={`w-full text-left bg-white border rounded-2xl p-5 lg:p-6 transition-colors hover:border-black/15 ${
                  m.status === 'new' ? 'border-black/15' : 'border-black/5'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${m.status === 'new' ? 'bg-[#0d0d0d]' : 'bg-black/10'}`}
                  />
                  <span className="font-medium truncate">{m.name || 'Guest'}</span>
                  <Badge className={meta.chip}>{meta.label}</Badge>
                  <span className="ml-auto text-[11px] text-black/35 whitespace-nowrap">
                    {age === null ? formatDateTime(m.createdAt) : age === 0 ? 'Today' : `${age}d ago`}
                  </span>
                </div>
                <p className="text-sm text-black/70 mt-2 truncate">{m.subject || 'No subject'}</p>
                <p className="text-xs text-black/40 mt-1 line-clamp-2">{m.body}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail */}
      <Modal
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.subject || 'Message'}
        wide
        footer={
          <>
            <Button variant="danger" onClick={() => void destroy()} disabled={busy}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
            <Button variant="light" onClick={() => void setStatus('archived')} disabled={busy || open?.status === 'archived'}>
              <Archive className="w-4 h-4" /> Archive
            </Button>
            <Button onClick={() => void setStatus('replied')} disabled={busy || open?.status === 'replied'}>
              <Reply className="w-4 h-4" /> Mark replied
            </Button>
          </>
        }
      >
        {open && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{open.name || 'Guest'}</p>
                <p className="text-xs text-black/40 mt-1">
                  Received {formatDateTime(open.createdAt)}
                </p>
              </div>
              <Badge className={MESSAGE_STATUS[open.status].chip}>{MESSAGE_STATUS[open.status].label}</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {isPhone(open.contact) ? (
                <>
                  <a href={waLink(open.contact)} target="_blank" rel="noreferrer">
                    <Button variant="dark" size="sm">
                      <MessageCircle className="w-3.5 h-3.5" /> Reply on WhatsApp
                    </Button>
                  </a>
                  <a href={`tel:${open.contact.replace(/\s/g, '')}`}>
                    <Button variant="light" size="sm">
                      <Phone className="w-3.5 h-3.5" /> Call {open.contact}
                    </Button>
                  </a>
                </>
              ) : (
                <a href={`mailto:${open.contact}?subject=${encodeURIComponent(`Re: ${open.subject || 'your message to Mkurugenzi'}`)}`}>
                  <Button variant="dark" size="sm">
                    <Mail className="w-3.5 h-3.5" /> Reply by email
                  </Button>
                </a>
              )}
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-black/40 mb-2">Contact</p>
              <p className="text-sm break-words">{open.contact || '—'}</p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-black/40 mb-2">Message</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{open.body}</p>
            </div>

            <div className="pt-5 border-t border-black/5">
              <Field label="Internal note" hint="Only the team sees this.">
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Quoted KES 4,200 for 24 hoodies, lead time 5 days…"
                />
              </Field>
              <div className="flex items-center justify-end gap-3 mt-3">
                <Button variant="ghost" size="sm" onClick={() => void setStatus('read')} disabled={busy}>
                  <Check className="w-3.5 h-3.5" /> Mark read
                </Button>
                <Button variant="light" size="sm" onClick={() => void saveNotes()} disabled={busy || notes === (open.notes ?? '')}>
                  <StickyNote className="w-3.5 h-3.5" /> Save note
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
