'use client';

import React, { useEffect, useState } from 'react';
import { SyncStatus, pushAllToSupabase } from '@/lib/inventoryService';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus;
  totalItems: number;
  onSyncSuccess: () => void;
}

const SCHEMA_URL = '/supabase-schema.sql';

export function SqlSchemaModal({
  isOpen,
  onClose,
  syncStatus,
  totalItems,
  onSyncSuccess,
}: SqlSchemaModalProps) {
  const [copied, setCopied] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string } | null>(null);
  const [schemaText, setSchemaText] = useState('');
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void fetch(SCHEMA_URL, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('The secure schema file could not be loaded.');
        return response.text();
      })
      .then((content) => { if (active) setSchemaText(content); })
      .catch((error: unknown) => {
        if (active) setSchemaError(error instanceof Error ? error.message : 'The secure schema file could not be loaded.');
      });
    return () => { active = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!schemaText) return;
    navigator.clipboard.writeText(schemaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePushData = async () => {
    setIsPushing(true);
    setPushResult(null);

    const res = await pushAllToSupabase();
    setIsPushing(false);

    if (res.success) {
      setPushResult({
        success: true,
        message: `🎉 Success! Pushed ${res.count} equipment items to your Supabase PostgreSQL table.`,
      });
      onSyncSuccess();
    } else {
      setPushResult({
        success: false,
        message: `Could not push: ${res.error}. If the table doesn't exist yet, please run Step 1 & 2 first.`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Supabase Cloud Sync Assistant
              </h3>
              <p className="text-xs text-zinc-500">
                Apply the secure schema before syncing your {totalItems} equipment records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Connection Status */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-800/60">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                syncStatus.source === 'supabase'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-blue-600'
              }`}
            />
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {syncStatus.source === 'supabase' ? 'Connected to Supabase' : 'Offline / Local Cache Mode'}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 truncate max-w-[280px]">
            {syncStatus.message}
          </span>
        </div>

        {/* 3 Step Interactive Workflow */}
        <div className="mt-5 space-y-4 text-xs">
          {/* Step 1 */}
          <div className="rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  1
                </span>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Open your Supabase SQL Editor
                </h4>
              </div>
              <a
                href="https://supabase.com/dashboard/project/vqaoeebuagtrfbxmfvcg/sql/new"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                <span>Open Project SQL Editor ↗</span>
              </a>
            </div>
            <p className="mt-1 pl-7 text-[11px] text-zinc-500">
              Log into your Supabase dashboard and go to <strong>SQL Editor</strong> on the left sidebar.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  2
                </span>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Copy and Run the Secure Database Schema
                </h4>
              </div>
              <button
                onClick={handleCopy}
                disabled={!schemaText}
                className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {copied ? (
                  <span className="text-emerald-400 dark:text-emerald-600 font-bold">✓ Copied!</span>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy SQL Code</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-1 pl-7 text-[11px] text-zinc-500">
              Click <strong>Copy SQL Code</strong>, paste it into the Supabase SQL editor, and click <strong>RUN</strong>. This removes older open-write policies, limits writes to the two authorized accounts, and creates the activity log.
            </p>
            <pre className="mt-2.5 max-h-36 overflow-y-auto rounded-lg bg-zinc-900 p-2.5 font-mono text-[10px] text-zinc-300">
              {schemaText || schemaError || 'Loading secure schema…'}
            </pre>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-200">
                    Push All {totalItems} Equipment Units to Cloud
                  </h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    Once the SQL table is created, click below to upload the entire dataset.
                  </p>
                </div>
              </div>
              <button
                onClick={handlePushData}
                disabled={isPushing}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
              >
                {isPushing ? (
                  <span>Syncing to Supabase...</span>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Push Data to Cloud Now</span>
                  </>
                )}
              </button>
            </div>

            {pushResult && (
              <div
                className={`mt-3 rounded-xl p-2.5 text-xs font-semibold ${
                  pushResult.success
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {pushResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
