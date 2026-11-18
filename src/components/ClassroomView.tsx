import React, { useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  NotebookPen,
  PlayCircle
} from 'lucide-react';
import {
  Course,
  DiscussionPost,
  DiscussionPostType,
  DiscussionReply,
  LessonNote,
  QuizResult
} from '../types/lms';
import { InteractiveVideoPlayer } from './InteractiveVideoPlayer';
import { PersonalNotebookPanel } from './PersonalNotebookPanel';
import { LessonDiscussionForum } from './LessonDiscussionForum';
import { downloadMaterialHandout, toBengaliDigits } from '../utils/lmsHelpers';

interface ClassroomViewProps {
  course: Course;
  activeLessonId: string;
  teacherName: string;
  teacherDesignation: string;
  teacherSchool: string;
  completedLessonIds: string[];
  readMaterialIds: string[];
  lessonNotes: Record<string, LessonNote>;
  customDiscussionPosts: DiscussionPost[];
  customDiscussionReplies: Record<string, DiscussionReply[]>;
  helpfulDiscussionIds: string[];
  quizResult?: QuizResult;
  onSelectLesson: (lessonId: string) => void;
  onToggleLessonComplete: (lessonId: string) => void;
  onMarkMaterialRead: (materialId: string) => void;
  onSaveLessonNote: (lessonId: string, content: string) => void;
  onDeleteLessonNote: (lessonId: string) => void;
  onCreateDiscussionPost: (post: {
    courseId: string;
    lessonId: string;
    type: DiscussionPostType;
    title: string;
    body: string;
  }) => void;
  onDeleteDiscussionPost: (postId: string) => void;
  onAddDiscussionReply: (postId: string, body: string) => void;
  onToggleDiscussionHelpful: (postId: string) => void;
  onStudySecondsTick?: (seconds: number) => void;
  onBackToCatalog: () => void;
  onGoToQuiz: () => void;
  onGoToCertificate: () => void;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({
  course,
  activeLessonId,
  teacherName,
  teacherDesignation,
  teacherSchool,
  completedLessonIds,
  readMaterialIds,
  lessonNotes,
  customDiscussionPosts,
  customDiscussionReplies,
  helpfulDiscussionIds,
  quizResult,
  onSelectLesson,
  onToggleLessonComplete,
  onMarkMaterialRead,
  onSaveLessonNote,
  onDeleteLessonNote,
  onCreateDiscussionPost,
  onDeleteDiscussionPost,
  onAddDiscussionReply,
  onToggleDiscussionHelpful,
  onStudySecondsTick,
  onBackToCatalog,
  onGoToQuiz,
  onGoToCertificate
}) => {
  const [contentTab, setContentTab] = useState<'overview' | 'checklist' | 'notebook'>('overview');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const activeLesson =
    course.lessons.find((l) => l.id === activeLessonId) ?? course.lessons[0];

  const completedInCourse = course.lessons.filter((l) =>
    completedLessonIds.includes(l.id)
  ).length;
  const progressPercent = Math.round(
    (completedInCourse / course.lessons.length) * 100
  );

  const isLessonDone = completedLessonIds.includes(activeLesson.id);
  const isMaterialRead = readMaterialIds.includes(activeLesson.material.id);

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb & Course Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#DDE5DF]">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5D52] hover:text-[#15803D] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>সব কোর্সে ফিরে যান</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#132219] tracking-tight">
            {course.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5D52]">
            <span>{course.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span>প্রশিক্ষক: {course.instructor}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {toBengaliDigits(completedInCourse)}/{toBengaliDigits(course.lessons.length)} পাঠ সম্পন্ন
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {quizResult?.passed ? (
            <button
              type="button"
              onClick={onGoToCertificate}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>সার্টিফিকেট দেখুন</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoToQuiz}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>কোর্স কুইজ দিন</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Zone Workspace: 70% Stage / 30% Curriculum */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Zone: Video Stage + Training Materials */}
        <div className="lg:col-span-8 space-y-6">
          <InteractiveVideoPlayer
            lesson={activeLesson}
            isCompleted={isLessonDone}
            onToggleComplete={() => onToggleLessonComplete(activeLesson.id)}
            onStudySecondsTick={onStudySecondsTick}
          />

          {/* Structured Training Material Card */}
          <div className="bg-white border border-[#DDE5DF] rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#EDF1EE]">
            <div className="space-y-1">
              <div className="text-xs font-medium text-[#4A5D52] flex items-center gap-2">
                <span>{activeLesson.number}</span>
                <span aria-hidden="true">·</span>
                <span>{activeLesson.material.formatLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{activeLesson.material.readTime}</span>
              </div>
              <h2 className="text-xl font-bold text-[#132219]">
                {activeLesson.material.title}
              </h2>
            </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onMarkMaterialRead(activeLesson.material.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                    isMaterialRead
                      ? 'bg-[#ECF2ED] border-[#15803D] text-[#15803D]'
                      : 'bg-white border-[#DDE5DF] text-[#4A5D52] hover:text-[#132219]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isMaterialRead ? 'পঠিত' : 'পঠিত চিহ্নিত করুন'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadMaterialHandout(course.title, activeLesson);
                    onMarkMaterialRead(activeLesson.material.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#132219] bg-[#F6F8F6] hover:bg-[#E8EFEA] border border-[#DDE5DF] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>লেসন প্ল্যান ডাউনলোড</span>
                </button>
              </div>
            </div>

            {/* Segmented Switcher for Notes vs Action Checklist vs Personal Notebook */}
            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F6F8F6] border border-[#DDE5DF] rounded-lg">
              <button
                type="button"
                onClick={() => setContentTab('overview')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  contentTab === 'overview'
                    ? 'bg-white text-[#132219] shadow-xs font-semibold'
                    : 'text-[#4A5D52] hover:text-[#132219]'
                }`}
              >
                শিক্ষণ কৌশল ও পাঠ পরিকল্পনা
              </button>
              <button
                type="button"
                onClick={() => setContentTab('checklist')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  contentTab === 'checklist'
                    ? 'bg-white text-[#132219] shadow-xs font-semibold'
                    : 'text-[#4A5D52] hover:text-[#132219]'
                }`}
              >
                শ্রেণিকক্ষ প্রস্তুতি চেকলিস্ট ({toBengaliDigits(activeLesson.material.actionChecklist.length)})
              </button>
              <button
                type="button"
                onClick={() => setContentTab('notebook')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  contentTab === 'notebook'
                    ? 'bg-white text-[#132219] shadow-xs font-semibold'
                    : 'text-[#4A5D52] hover:text-[#132219]'
                }`}
              >
                <NotebookPen className="w-3.5 h-3.5 text-[#15803D]" />
                <span>
                  ব্যক্তিগত নোটবুক
                  {lessonNotes[activeLesson.id]?.content.trim()
                    ? ' · সংরক্ষিত'
                    : ''}
                </span>
              </button>
            </div>

            {contentTab === 'overview' ? (
              <div className="space-y-5">
                <p className="text-[15px] leading-relaxed text-[#2C3E33] max-w-[70ch]">
                  {activeLesson.material.summary}
                </p>

                {/* Classroom Application Strip */}
                <div className="p-4 rounded-lg bg-[#ECF2ED]/60 border border-[#D4E3D8] grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-[#4A5D52]">উপযোগী শ্রেণি</div>
                    <div className="text-sm font-semibold text-[#132219] mt-0.5">
                      {activeLesson.material.classroomActivity.gradeLevel}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#4A5D52]">পিরিয়ড সময়কাল</div>
                    <div className="text-sm font-semibold text-[#132219] mt-0.5">
                      {activeLesson.material.classroomActivity.duration}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#4A5D52]">প্রত্যাশিত শিখনফল</div>
                    <div className="text-sm font-medium text-[#132219] mt-0.5">
                      {activeLesson.material.classroomActivity.objective}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold text-[#132219]">
                    শিক্ষকের জন্য মূল শিক্ষণীয় বিষয়
                  </h3>
                  <ul className="space-y-2.5">
                    {activeLesson.material.keyPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm leading-relaxed text-[#2C3E33]"
                      >
                        <span className="font-mono tabular-nums text-xs font-semibold text-[#15803D] mt-0.5 shrink-0">
                          ০{toBengaliDigits(idx + 1)}.
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {activeLesson.material.formulaOrMetric && (
                  <div className="p-4 rounded-lg bg-[#F6F8F6] border border-[#DDE5DF] space-y-1.5">
                    <div className="text-xs font-semibold text-[#15803D]">
                      {activeLesson.material.formulaOrMetric.label}
                    </div>
                    <div className="font-mono text-sm font-semibold text-[#132219] break-all">
                      {activeLesson.material.formulaOrMetric.expression}
                    </div>
                    <div className="text-xs text-[#4A5D52]">
                      {activeLesson.material.formulaOrMetric.note}
                    </div>
                  </div>
                )}
              </div>
            ) : contentTab === 'checklist' ? (
              <div className="space-y-3">
                <p className="text-xs text-[#4A5D52]">
                  প্রশিক্ষণের পর বাস্তব জীবনে অনুশীলনের জন্য নিচের ধাপগুলো টিক দিয়ে চিহ্নিত করুন:
                </p>
                <div className="space-y-2">
                  {activeLesson.material.actionChecklist.map((item, idx) => {
                    const key = `${activeLesson.id}-${idx}`;
                    const checked = Boolean(checkedItems[key]);
                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors cursor-pointer min-h-[44px] ${
                          checked
                            ? 'bg-[#ECF2ED] border-[#15803D]/40 text-[#132219]'
                            : 'bg-[#F6F8F6] border-[#DDE5DF] text-[#2C3E33] hover:bg-[#EFF4F0]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCheck(key)}
                          className="mt-0.5 w-4 h-4 accent-[#15803D] rounded cursor-pointer"
                        />
                        <span
                          className={`text-sm leading-relaxed ${
                            checked ? 'line-through text-[#4A5D52]' : ''
                          }`}
                        >
                          {item}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <PersonalNotebookPanel
                course={course}
                lesson={activeLesson}
                teacherName={teacherName}
                savedNote={lessonNotes[activeLesson.id]}
                allLessonNotes={lessonNotes}
                onSaveNote={onSaveLessonNote}
                onDeleteNote={onDeleteLessonNote}
                onSelectLesson={onSelectLesson}
              />
            )}
          </div>

          {/* Lesson Discussion Forum */}
          <LessonDiscussionForum
            course={course}
            lesson={activeLesson}
            learnerName={teacherName}
            designation={teacherDesignation}
            schoolName={teacherSchool}
            customPosts={customDiscussionPosts}
            customReplies={customDiscussionReplies}
            helpfulIds={helpfulDiscussionIds}
            onCreatePost={onCreateDiscussionPost}
            onDeletePost={onDeleteDiscussionPost}
            onAddReply={onAddDiscussionReply}
            onToggleHelpful={onToggleDiscussionHelpful}
          />
        </div>

        {/* Right Zone: Sticky Curriculum Sidebar */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          <div className="bg-white border border-[#DDE5DF] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#132219]">
                পাঠ্যসূচি ও মডিউল
              </h2>
              <span className="text-xs font-mono tabular-nums font-semibold text-[#15803D]">
                {toBengaliDigits(progressPercent)}% সম্পন্ন
              </span>
            </div>

            {/* Clean Progress Bar */}
            <div
              className="w-full h-2 bg-[#E8EFEA] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-[#15803D] transition-transform duration-300 origin-left"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>

            {/* Lesson List */}
            <div className="divide-y divide-[#EDF1EE]">
              {course.lessons.map((lesson) => {
                const isSelected = lesson.id === activeLesson.id;
                const done = completedLessonIds.includes(lesson.id);
                const hasNote = Boolean(lessonNotes[lesson.id]?.content.trim());
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => onSelectLesson(lesson.id)}
                    className={`w-full text-left py-3.5 px-3 -mx-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#ECF2ED]'
                        : 'hover:bg-[#F6F8F6]'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {done ? (
                        <CheckCircle2
                          className="w-4 h-4 text-[#15803D]"
                          aria-label="সম্পন্ন"
                        />
                      ) : (
                        <PlayCircle
                          className={`w-4 h-4 ${
                            isSelected ? 'text-[#15803D]' : 'text-[#4A5D52]'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#4A5D52]">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{lesson.number}</span>
                          {hasNote && (
                            <span className="inline-flex items-center gap-0.5 text-[#15803D] font-medium">
                              <span aria-hidden="true">·</span>
                              <NotebookPen className="w-3 h-3" aria-hidden="true" />
                              <span>নোট</span>
                            </span>
                          )}
                        </span>
                        <span className="font-mono tabular-nums">
                          {lesson.durationLabel}
                        </span>
                      </div>
                      <div
                        className={`text-sm leading-snug ${
                          isSelected
                            ? 'font-semibold text-[#132219]'
                            : 'font-medium text-[#2C3E33]'
                        }`}
                      >
                        {lesson.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quiz & Certificate Box */}
            <div className="pt-4 border-t border-[#DDE5DF] space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-[#4A5D52]">
                <FileText className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  কোর্স শেষে ৫ প্রশ্নের কুইজে ৬০% নম্বর পেলেই তাৎক্ষণিক ডিজিটাল সার্টিফিকেট ডাউনলোড করতে পারবেন।
                </span>
              </div>

              <button
                type="button"
                onClick={onGoToQuiz}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors min-h-[44px] cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>
                  {quizResult
                    ? `পুনরায় কুইজ দিন (সেরা: ${toBengaliDigits(quizResult.percentage)}%)`
                    : 'মূল্যায়ন কুইজ শুরু করুন'}
                </span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
