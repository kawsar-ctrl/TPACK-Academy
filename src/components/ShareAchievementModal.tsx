import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Share2,
  Sparkles,
  X
} from 'lucide-react';
import { EvaluatedAchievement, LearnerProgress } from '../types/lms';
import { AchievementBadgeEmblem } from './AchievementBadgeEmblem';
import {
  AchievementShareFormat,
  buildAchievementShareSummary,
  copyTextToClipboard,
  downloadAchievementBadgePng,
  toBengaliDigits
} from '../utils/lmsHelpers';

interface ShareAchievementModalProps {
  badge: EvaluatedAchievement | null;
  progress: LearnerProgress;
  onClose: () => void;
}

const FORMAT_OPTIONS: { id: AchievementShareFormat; label: string }[] = [
  { id: 'bn', label: 'বাংলা পোস্ট' },
  { id: 'en', label: 'English (LinkedIn)' },
  { id: 'short', label: 'সংক্ষিপ্ত (X)' }
];

export const ShareAchievementModal: React.FC<ShareAchievementModalProps> = ({
  badge,
  progress,
  onClose
}) => {
  const [format, setFormat] = useState<AchievementShareFormat>('bn');
  const [summaryText, setSummaryText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!badge) return;
    setCopied(false);
    setSummaryText(
      buildAchievementShareSummary({
        titleEn: badge.titleEn,
        titleBn: badge.titleBn,
        tierLabel: badge.tierLabel,
        criteriaLabel: badge.criteriaLabel,
        learnerName: progress.learnerName,
        designation: progress.designation,
        schoolName: progress.schoolName,
        earnedAt: badge.earnedAt,
        format
      })
    );
  }, [badge, format, progress.designation, progress.learnerName, progress.schoolName]);

  useEffect(() => {
    if (!badge) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [badge, onClose]);

  if (!badge) return null;

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(summaryText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleRegenerate = (nextFormat: AchievementShareFormat) => {
    setFormat(nextFormat);
    setCopied(false);
    setSummaryText(
      buildAchievementShareSummary({
        titleEn: badge.titleEn,
        titleBn: badge.titleBn,
        tierLabel: badge.tierLabel,
        criteriaLabel: badge.criteriaLabel,
        learnerName: progress.learnerName,
        designation: progress.designation,
        schoolName: progress.schoolName,
        earnedAt: badge.earnedAt,
        format: nextFormat
      })
    );
  };

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `${badge.titleEn} — TPACK Academy`,
        text: summaryText
      });
    } catch {
      // User cancelled native share
    }
  };

  const encodedText = encodeURIComponent(summaryText);
  const currentUrl =
    typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';

  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
  const linkedInShareUrl = `https://www.linkedin.com/feed/?shareActive=true&mini=true&text=${encodedText}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}&quote=${encodedText}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-achievement-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white border border-[#DDE5DF] rounded-xl overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#DDE5DF] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#15803D]" />
            <h2
              id="share-achievement-modal-title"
              className="text-lg font-bold text-[#132219]"
            >
              অর্জন শেয়ার করুন (Share Achievement)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#4A5D52] hover:bg-[#F6F8F6] hover:text-[#132219] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Earned Badge Preview Strip */}
          <div className="p-4 rounded-xl bg-[#F6F8F6] border border-[#DDE5DF] flex items-center gap-4">
            <AchievementBadgeEmblem
              iconKey={badge.iconKey}
              tier={badge.tier}
              unlocked={true}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#15803D]">
                {badge.tierLabel} · {badge.earnedAt || 'সম্প্রতি অর্জিত'}
              </div>
              <div className="text-lg font-bold font-display text-[#132219] truncate">
                {badge.titleEn}
              </div>
              <div className="text-sm font-medium text-[#2C3E33] truncate">
                {badge.titleBn}
              </div>
            </div>
          </div>

          {/* Summary Format Tabs */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#132219] inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#15803D]" />
                <span>সোশ্যাল মিডিয়া সারসংক্ষেপ ধরন</span>
              </span>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EBF1EC] border border-[#DDE5DF] rounded-lg">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleRegenerate(opt.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      format === opt.id
                        ? 'bg-white text-[#132219] shadow-xs font-semibold'
                        : 'text-[#4A5D52] hover:text-[#132219]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              aria-label="শেয়ার করার সারসংক্ষেপ লেখা"
              value={summaryText}
              onChange={(e) => {
                setSummaryText(e.target.value);
                if (copied) setCopied(false);
              }}
              rows={7}
              className="w-full px-3.5 py-3 text-sm bg-[#FAFDF9] border border-[#DDE5DF] rounded-lg text-[#132219] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#15803D] resize-y"
            />

            <div className="flex items-center justify-between text-xs text-[#4A5D52]">
              <span>পোস্ট করার আগে প্রয়োজনে লেখাটি সম্পাদনা করতে পারবেন।</span>
              <span className="font-mono tabular-nums">
                {toBengaliDigits(summaryText.length)} অক্ষর
              </span>
            </div>
          </div>

          {/* Primary Actions: Copy & Download PNG */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors min-h-[42px] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ক্লিপবোর্ডে কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>সারসংক্ষেপ কপি করুন</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                downloadAchievementBadgePng({
                  id: badge.id,
                  titleEn: badge.titleEn,
                  titleBn: badge.titleBn,
                  tierLabel: badge.tierLabel,
                  criteriaLabel: badge.criteriaLabel,
                  tier: badge.tier,
                  learnerName: progress.learnerName,
                  designation: progress.designation,
                  schoolName: progress.schoolName,
                  earnedAt: badge.earnedAt
                })
              }
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#132219] bg-[#F6F8F6] hover:bg-[#E8EFEA] border border-[#DDE5DF] rounded-lg transition-colors min-h-[42px] cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#15803D]" />
              <span>ব্যাজ PNG নামান</span>
            </button>

            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#15803D] bg-[#ECF2ED] hover:bg-[#DCE9DF] rounded-lg transition-colors min-h-[42px] cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>শেয়ার মেনু</span>
              </button>
            )}
          </div>

          {/* Direct Social Platform Links */}
          <div className="pt-4 border-t border-[#EDF1EE] space-y-2.5">
            <div className="text-xs font-semibold text-[#4A5D52]">
              সরাসরি সোশ্যাল প্ল্যাটফর্মে পোস্ট করুন
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <a
                href={linkedInShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#132219] bg-white hover:bg-[#F6F8F6] border border-[#DDE5DF] rounded-lg transition-colors"
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#4A5D52]" />
              </a>
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void copyTextToClipboard(summaryText);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#132219] bg-white hover:bg-[#F6F8F6] border border-[#DDE5DF] rounded-lg transition-colors"
              >
                <span>Facebook</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#4A5D52]" />
              </a>
              <a
                href={xShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#132219] bg-white hover:bg-[#F6F8F6] border border-[#DDE5DF] rounded-lg transition-colors"
              >
                <span>X (Twitter)</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#4A5D52]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
