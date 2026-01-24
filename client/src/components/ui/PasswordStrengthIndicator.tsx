import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    Object.values(checks).forEach((check) => {
      if (check) score++;
    });

    let level = 'Weak';
    let color = 'text-red-500';
    let bgColor = 'bg-red-100';

    if (score >= 4) {
      level = 'Strong';
      color = 'text-green-500';
      bgColor = 'bg-green-100';
    } else if (score >= 3) {
      level = 'Good';
      color = 'text-yellow-500';
      bgColor = 'bg-yellow-100';
    } else if (score >= 2) {
      level = 'Fair';
      color = 'text-orange-500';
      bgColor = 'bg-orange-100';
    }

    return { score, level, color, bgColor, checks };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-3 pt-2">
      {/* Strength level */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              strength.score === 1
                ? 'w-1/5 bg-red-500'
                : strength.score === 2
                  ? 'w-2/5 bg-orange-500'
                  : strength.score === 3
                    ? 'w-3/5 bg-yellow-500'
                    : 'w-full bg-green-500'
            }`}
          />
        </div>
        <span className={`text-xs font-semibold ${strength.color}`}>
          {strength.level}
        </span>
      </div>

      {/* Requirement checks */}
      <div className={`rounded-md p-3 ${strength.bgColor} space-y-2`}>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            {strength.checks.length ? (
              <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
            ) : (
              <X className="w-3 h-3 text-red-500 flex-shrink-0" />
            )}
            <span
              className={`text-xs ${
                strength.checks.length ? 'text-green-700' : 'text-red-700'
              }`}
            >
              8+ characters
            </span>
          </div>
          <div className="flex items-center gap-2">
            {strength.checks.uppercase ? (
              <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
            ) : (
              <X className="w-3 h-3 text-red-500 flex-shrink-0" />
            )}
            <span
              className={`text-xs ${
                strength.checks.uppercase ? 'text-green-700' : 'text-red-700'
              }`}
            >
              Uppercase
            </span>
          </div>
          <div className="flex items-center gap-2">
            {strength.checks.lowercase ? (
              <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
            ) : (
              <X className="w-3 h-3 text-red-500 flex-shrink-0" />
            )}
            <span
              className={`text-xs ${
                strength.checks.lowercase ? 'text-green-700' : 'text-red-700'
              }`}
            >
              Lowercase
            </span>
          </div>
          <div className="flex items-center gap-2">
            {strength.checks.number ? (
              <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
            ) : (
              <X className="w-3 h-3 text-red-500 flex-shrink-0" />
            )}
            <span
              className={`text-xs ${
                strength.checks.number ? 'text-green-700' : 'text-red-700'
              }`}
            >
              Number
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
