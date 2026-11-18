import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  NotebookPen,
  Plus,
  Save,
  Trash2
} from 'lucide-react';
import { Course, Lesson, LessonNote } from '../types/lms';
import { downloadLessonNoteTxt, toBengaliDigits } from '../utils/lmsHelpers';

interface PersonalNotebookPanelProps {
  course: Course;
  lesson: Lesson;
  teacherName: string;
  savedNote?: LessonNote;
  allLessonNotes: Record<string, LessonNote>;
  onSaveNote: (lessonId: string, content: string) => void;
  onDeleteNote: (lessonId: string) => void;
  onSelectLesson: (lessonId: string) => void;
}

const NOTE_PROMPTS = [
  {
    label: 'শ্রেণিকক্ষ প্রয়োগ',
    snippet: 'শ্রেণিকক্ষে প্রয়োগ পরিকল্পনা:\n- '
  },
  {
    label: 'মূল ভাবনা',
    snippet: 'এই পাঠের মূল শিক্ষণীয়:\n- '
  },
  {
    label: 'শিক্ষার্থীর প্রশ্ন/চ্যালেঞ্জ',
    snippet: 'সম্ভাব্য প্রশ্ন ও সমাধান:\n- '
  }
];

export const PersonalNotebookPanel: React.FC<PersonalNotebookPanelProps> = ({
  course,
  lesson,
  teacherName,
  savedNote,
  allLessonNotes,
  onSaveNote,
  onDeleteNote,
  onSelectLesson
}) => {
  const [draft, setDraft] = useState(savedNote?.content ?? '');
  const [justSaved, setJustSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync local draft when switching to another lesson or when external savedNote changes
  useEffect(() => {
    setDraft(savedNote?.content ?? '');
    setConfirmDelete(false);
    setJustSaved(false);
  }, [lesson.id, savedNote?.content]);

  const savedContent = savedNote?.content ?? '';
  const isDirty = draft !== savedContent;
  const trimmedDraft = draft.trim();
  const wordCount = trimmedDraft ? trimmedDraft.split(/\s+/).length : 0;
  const charCount = draft.length;

  // Debounced auto-save to localStorage when user pauses typing (keeps notes safe even without clicking Save)
  useEffect(() => {
    if (!isDirty) return;
    const timer = window.setTimeout(() => {
      if (draft.trim()) {
        onSaveNote(lesson.id, draft);
      } else if (savedNote) {
        onDeleteNote(lesson.id);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [draft, isDirty, lesson.id, savedNote, onSaveNote, onDeleteNote]);

  const handleManualSave = () => {
    if (draft.trim()) {
      onSaveNote(lesson.id, draft);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2500);
    } else if (savedNote) {
      onDeleteNote(lesson.id);
    }
  };

  const handleInsertPrompt = (snippet: string) => {
    setDraft((prev) => {
      const prefix = prev.trim().length > 0 ? `${prev.trimEnd()}\n\n` : '';
      return `${prefix}${snippet}`;
    });
  };

  const courseNotesList = course.lessons.filter(
    (l) => Boolean(allLessonNotes[l.id]?.content.trim())
  );

  return (
    <div className="space-y-4">
      {/* Header & Save Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-[#4A5D52]">
          <NotebookPen className="w-4 h-4 text-[#15803D] shrink-0" />
          <span>
            <strong className="text-[#132219]">{lesson.number}</strong>-এর ব্যক্তিগত নোট (স্বয়ংক্রিয়ভাবে ব্রাউজারে সংরক্ষিত থাকে)
          </span>
        </div>

        <div className="text-xs font-mono tabular-nums text-[#4A5D52] shrink-0">
          {justSaved ? (
            <span className="inline-flex items-center gap-1 font-sans font-semibold text-[#15803D]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>নোট সংরক্ষিত হয়েছে</span>
            </span>
          ) : isDirty ? (
            <span className="font-sans text-[#B45309] font-medium">
              সংরক্ষণ হচ্ছে...
            </span>
          ) : savedNote ? (
            <span>সংরক্ষিত: {savedNote.updatedAt}</span>
          ) : (
            <span>এখনো কোনো নোট লেখা হয়নি</span>
          )}
        </div>
      </div>

      {/* Quick Structured Insert Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#4A5D52]">দ্রুত যুক্ত করুন:</span>
        {NOTE_PROMPTS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleInsertPrompt(item.snippet)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#132219] bg-[#F6F8F6] hover:bg-[#ECF2ED] border border-[#DDE5DF] rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[#15803D]" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Textarea Editor */}
      <div>
        <label htmlFor={`lesson-note-${lesson.id}`} className="sr-only">
          {lesson.title} পাঠের ব্যক্তিগত নোট
        </label>
        <textarea
          id={`lesson-note-${lesson.id}`}
          rows={7}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="এই পাঠের মূল শিক্ষণ কৌশল, আপনার শ্রেণিকক্ষের জন্য উপযোগী উদাহরণ, বা পরবর্তী ক্লাসে প্রয়োগের নোট এখানে লিখুন..."
          className="w-full p-4 text-sm leading-relaxed bg-[#FAFDF9] border border-[#DDE5DF] rounded-xl text-[#132219] placeholder:text-[#7A8D81] focus:outline-none focus:ring-2 focus:ring-[#15803D] resize-y min-h-[180px]"
        />
        <div className="mt-1.5 flex items-center justify-between text-xs font-mono tabular-nums text-[#4A5D52]">
          <span>
            {toBengaliDigits(wordCount)} শব্দ · {toBengaliDigits(charCount)} অক্ষর
          </span>
          <span>localStorage-এ স্থায়ীভাবে সংরক্ষিত</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleManualSave}
            disabled={!trimmedDraft && !savedNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] disabled:bg-[#9FB5A7] disabled:cursor-not-allowed rounded-lg transition-colors min-h-[40px] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>নোট সংরক্ষণ করুন</span>
          </button>

          {trimmedDraft && (
            <button
              type="button"
              onClick={() =>
                downloadLessonNoteTxt({
                  courseTitle: course.title,
                  lessonNumber: lesson.number,
                  lessonTitle: lesson.title,
                  lessonId: lesson.id,
                  teacherName,
                  content: draft,
                  updatedAt:
                    savedNote?.updatedAt ??
                    new Date().toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#132219] bg-[#F6F8F6] hover:bg-[#E8EFEA] border border-[#DDE5DF] rounded-lg transition-colors min-h-[40px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#15803D]" />
              <span>নোট ডাউনলোড (.TXT)</span>
            </button>
          )}
        </div>

        {(trimmedDraft || savedNote) && (
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft('');
                    onDeleteNote(lesson.id);
                    setConfirmDelete(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-md cursor-pointer"
                >
                  নিশ্চিত মুছুন
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#4A5D52] bg-[#F6F8F6] border border-[#DDE5DF] rounded-md cursor-pointer"
                >
                  বাতিল
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A5D52] hover:text-[#DC2626] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>নোট মুছুন</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Saved Notes Directory across this Course */}
      {courseNotesList.length > 0 && (
        <div className="pt-4 border-t border-[#EDF1EE] space-y-2.5">
          <div className="text-xs font-semibold text-[#132219]">
            এই কোর্সে আপনার সংরক্ষিত নোটসমূহ ({toBengaliDigits(courseNotesList.length)}টি পাঠ)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {courseNotesList.map((item) => {
              const note = allLessonNotes[item.id];
              const isCurrent = item.id === lesson.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectLesson(item.id)}
                  className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#ECF2ED] border-[#15803D] text-[#132219]'
                      : 'bg-[#F6F8F6] border-[#DDE5DF] text-[#2C3E33] hover:bg-[#EFF4F0]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#4A5D52]">
                    <span className="font-semibold text-[#15803D]">
                      {item.number}
                    </span>
                    <span className="font-mono tabular-nums">
                      {note.updatedAt}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#132219] truncate mt-0.5">
                    {item.title}
                  </div>
                  <div className="text-xs text-[#4A5D52] line-clamp-1 mt-0.5">
                    {note.content}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
