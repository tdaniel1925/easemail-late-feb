"use client";

import { useState, useEffect } from "react";
import { FileSignature, Edit2, Trash2, Star } from "lucide-react";
import { SignatureEditorModal } from "./SignatureEditorModal";
import type { Database } from "@/types/database";

type EmailSignature = Database['public']['Tables']['email_signatures']['Row'];
type Account = {
  id: string;
  email: string;
  display_name: string | null;
};

export function SignatureSettings() {
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSignature, setEditingSignature] = useState<EmailSignature | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchSignatures();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
    }
  };

  const fetchSignatures = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/signatures');
      if (!response.ok) throw new Error('Failed to fetch signatures');
      const data = await response.json();
      setSignatures(data.signatures || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSignature(null);
    setEditorOpen(true);
  };

  const handleEdit = (signature: EmailSignature) => {
    setEditingSignature(signature);
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this signature?')) {
      return;
    }

    try {
      const response = await fetch(`/api/signatures/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete signature');
      }

      await fetchSignatures();
    } catch (err: any) {
      setActionError(`Error deleting signature: ${err.message}`);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/signatures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to set default signature');
      }

      await fetchSignatures();
    } catch (err: any) {
      setActionError(`Error setting default signature: ${err.message}`);
    }
  };

  const handleSave = () => {
    fetchSignatures();
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return "All Accounts";
    const account = accounts.find((a) => a.id === accountId);
    return account ? (account.display_name || account.email) : "Unknown Account";
  };

  const filteredSignatures = signatures.filter((sig) => {
    if (selectedAccountFilter === "all") return true;
    return sig.account_id === selectedAccountFilter || sig.account_id === null;
  });

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Signatures</h2>
        <p className="mt-1 text-sm text-text-secondary">Manage your email signatures</p>
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border-default bg-surface-secondary p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded bg-surface-tertiary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-surface-tertiary" />
                  <div className="h-3 w-32 animate-pulse rounded bg-surface-tertiary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Signatures</h2>
        <p className="mt-1 text-sm text-text-secondary">Manage your email signatures</p>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Error loading signatures: {error}</p>
          <button
            onClick={fetchSignatures}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary">Signatures</h2>
      <p className="mt-1 text-sm text-text-secondary">Manage your email signatures</p>

      {/* Action Error Display */}
      {actionError && (
        <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Account Filter */}
      {accounts.length > 1 && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Filter by Account
          </label>
          <select
            value={selectedAccountFilter}
            onChange={(e) => setSelectedAccountFilter(e.target.value)}
            className="w-full max-w-md rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.display_name || account.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Signatures List */}
      <div className="mt-6 space-y-3">
        {filteredSignatures.length === 0 ? (
          <div className="rounded-lg border border-border-default bg-surface-secondary p-6 text-center">
            <FileSignature size={48} className="mx-auto mb-3 text-text-tertiary" strokeWidth={1} />
            <h3 className="text-sm font-medium text-text-primary">No signatures yet</h3>
            <p className="mt-1 text-xs text-text-tertiary">
              Create your first email signature
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              New Signature
            </button>
          </div>
        ) : (
          <>
            {filteredSignatures.map((signature) => (
              <div
                key={signature.id}
                className="rounded-lg border border-border-default bg-surface-secondary p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-tertiary text-text-secondary">
                      <FileSignature size={24} strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-primary truncate">
                        {signature.name}
                      </h3>
                      {signature.is_default && (
                        <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
                          <Star size={12} className="mr-1" fill="currentColor" />
                          Default
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-text-secondary truncate">
                      {getAccountName(signature.account_id)}
                    </p>

                    {/* Preview */}
                    <div
                      className="mt-2 text-xs text-text-tertiary line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: signature.body_html }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {!signature.is_default && (
                      <button
                        onClick={() => handleSetDefault(signature.id)}
                        className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                        title="Set as default"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(signature)}
                      className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      <Edit2 size={14} className="inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(signature.id)}
                      className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-red-600"
                    >
                      <Trash2 size={14} className="inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Button */}
            <div className="rounded-lg border border-dashed border-border-default bg-surface-secondary p-4 text-center">
              <button
                onClick={handleCreate}
                className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                New Signature
              </button>
            </div>
          </>
        )}
      </div>

      {/* Editor Modal */}
      <SignatureEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        signature={editingSignature}
        accounts={accounts}
        onSave={handleSave}
      />
    </div>
  );
}
