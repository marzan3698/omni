import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink } from 'lucide-react';

export function CopyOpenRow({
  label,
  value,
  copyKey,
  copied,
  onCopy,
  showOpen = false,
}: {
  label: string;
  value: string;
  copyKey: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  showOpen?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input readOnly value={value} className="font-mono text-sm flex-1" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onCopy(value, copyKey)}
          title="কপি করুন"
        >
          {copied === copyKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        {showOpen && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => window.open(value, '_blank')}
            title="নতুন ট্যাবে খুলুন"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
