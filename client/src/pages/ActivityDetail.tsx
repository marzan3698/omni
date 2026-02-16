import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { activityApi, type EmployeeDetail as EmployeeDetailType } from '@/lib/activityApi';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Monitor, Clock, Image, Activity, X } from 'lucide-react';
import { ErrorAlert } from '@/components/ErrorAlert';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function blockColor(score: number): string {
  if (score === 0) return 'bg-slate-600';
  if (score <= 20) return 'bg-red-500';
  if (score <= 50) return 'bg-amber-500';
  if (score <= 80) return 'bg-green-500';
  return 'bg-green-600';
}

export default function ActivityDetail() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const [selectedImage, setSelectedImage] = useState<{
    imageUrl: string;
    capturedAt: string;
    pageUrl: string | null;
  } | null>(null);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['activity-employee-detail', userId, date],
    queryFn: async () => activityApi.getEmployeeDetail(userId!, date),
    enabled: !!user && !!userId,
  });

  const detail = response?.data?.data as EmployeeDetailType | undefined;

  const handleBack = () => {
    navigate(`/activity-monitor?date=${date}`);
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert error={error} />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-amber-200/80">Invalid employee.</p>
        <Button variant="outline" className="mt-4 border-amber-500/50 text-amber-100 hover:bg-amber-500/20" onClick={handleBack}>
          Back to monitor
        </Button>
      </div>
    );
  }

  if (isLoading || !detail) {
    return (
      <div className="p-6">
        <div className="py-8 text-center text-amber-200/80">Loading...</div>
      </div>
    );
  }

  const { user: emp, totalWorkMinutes, avgActivityScore, screenshotCount, activityByBlock, screenshots } = detail;
  const idleMinutes = Math.max(0, 24 * 60 - totalWorkMinutes);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 text-amber-100 hover:bg-amber-500/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-amber-100">{emp.name ?? emp.email}</h1>
            <p className="text-sm text-amber-200/80">{emp.email} · {emp.roleName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="detail-date" className="text-sm text-amber-200/80">Date</label>
          <input
            id="detail-date"
            type="date"
            value={date}
            onChange={(e) => {
              const d = e.target.value;
              navigate({ pathname: `/activity-monitor/${userId}`, search: `?date=${d}` });
            }}
            className="rounded-md border border-amber-500/20 bg-slate-800/60 px-3 py-2 text-sm text-amber-100 focus:ring-amber-500/50 focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GameCard index={0}>
          <div className="p-6">
            <div className="flex items-center gap-2 text-amber-200/80">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Work time</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-amber-100">{formatMinutes(totalWorkMinutes)}</p>
          </div>
        </GameCard>
        <GameCard index={1}>
          <div className="pt-4 p-6">
            <div className="flex items-center gap-2 text-amber-200/80">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Idle (est.)</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-amber-100">{formatMinutes(idleMinutes)}</p>
          </div>
        </GameCard>
        <GameCard index={2}>
          <div className="pt-4 p-6">
            <div className="flex items-center gap-2 text-amber-200/80">
              <Monitor className="h-4 w-4" />
              <span className="text-sm">Avg score</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-amber-100">{avgActivityScore}</p>
          </div>
        </GameCard>
        <GameCard index={3}>
          <div className="pt-4 p-6">
            <div className="flex items-center gap-2 text-amber-200/80">
              <Image className="h-4 w-4" />
              <span className="text-sm">Screenshots</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-amber-100">{screenshotCount}</p>
          </div>
        </GameCard>
      </div>

      {/* Activity timeline */}
      <GamePanel>
        <div className="p-6">
          <h2 className="text-base font-semibold text-amber-100">Activity timeline</h2>
          <p className="text-sm text-amber-200/70 pt-2">Green = active, yellow = low, red = idle, gray = offline (10-min blocks).</p>
          <div className="flex flex-wrap gap-0.5">
            {activityByBlock.map((block, i) => (
              <div
                key={i}
                className={cn(
                  'h-6 w-4 rounded-sm shrink-0',
                  blockColor(block.score)
                )}
                title={`${new Date(block.blockStart).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })} - ${block.label} (${block.score})`}
              />
            ))}
          </div>
        </div>
      </GamePanel>

      {/* Screenshots gallery */}
      <GamePanel>
        <div className="p-6">
          <h2 className="text-base font-semibold text-amber-100 mb-4">Screenshots</h2>
          {screenshots.length === 0 ? (
            <p className="text-amber-200/70 py-4">No screenshots for this date.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {screenshots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedImage({ imageUrl: s.imageUrl, capturedAt: s.capturedAt, pageUrl: s.pageUrl })}
                  className="rounded-lg border border-amber-500/20 overflow-hidden hover:ring-2 hover:ring-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <img src={getImageUrl(s.imageUrl)} alt={`Capture ${s.capturedAt}`} className="w-full aspect-video object-cover" />
                  <p className="text-xs text-amber-200/70 p-1 truncate">{new Date(s.capturedAt).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </GamePanel>

      {/* Full-size image modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div
            className="rounded-xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', boxShadow: '0 0 0 1px rgba(217,119,6,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 border-b border-amber-500/20">
              <p className="text-sm text-amber-200/80">
                {new Date(selectedImage.capturedAt).toLocaleString()}
                {selectedImage.pageUrl && ` · ${selectedImage.pageUrl}`}
              </p>
              <Button variant="ghost" size="icon" onClick={() => setSelectedImage(null)} className="text-amber-100 hover:bg-amber-500/20">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <img
              src={getImageUrl(selectedImage.imageUrl)}
              alt="Screenshot"
              className="max-h-[80vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
