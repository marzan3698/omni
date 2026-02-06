import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Users, Archive, X } from 'lucide-react';

export interface DistributeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: { distributed: number; failed: number }) => void;
  unassignedCount: number;
  activeRepsCount: number;
  distribute: (count: number) => Promise<{ distributed: number; failed: number }>;
}

export function DistributeModal({
  open,
  onClose,
  onSuccess,
  unassignedCount,
  activeRepsCount,
  distribute,
}: DistributeModalProps) {
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ distributed: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDistribute = async () => {
    const num = Math.min(Math.max(1, count), 100);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await distribute(num);
      setResult(res);
      onSuccess?.(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Distribution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCount(10);
    setResult(null);
    setError(null);
    onClose();
  };

  const maxCount = Math.min(100, Math.max(1, unassignedCount));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Distribute conversations</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-slate-500 hover:bg-gray-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 py-2">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Unassigned (Archive): <strong>{unassignedCount}</strong>
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active reps: <strong>{activeRepsCount}</strong>
            </span>
          </div>
          {activeRepsCount === 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
              No Customer Care reps are currently active. Assignments will fail until someone is online.
            </p>
          )}
          {!result ? (
            <>
              <div>
                <Label htmlFor="distribute-count">Number to distribute (1–{maxCount})</Label>
                <Input
                  id="distribute-count"
                  type="number"
                  min={1}
                  max={maxCount}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
                  className="mt-1"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </>
          ) : (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              <p><strong>{result.distributed}</strong> conversation(s) distributed.</p>
              {result.failed > 0 && (
                <p className="mt-1">{result.failed} could not be assigned (e.g. no active reps).</p>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          {result ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleDistribute}
                disabled={loading || unassignedCount === 0 || activeRepsCount === 0}
              >
                {loading ? 'Distributing...' : 'Distribute'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
