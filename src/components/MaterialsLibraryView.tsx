import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  Search
} from 'lucide-react';
import { Course, CourseCategory, Lesson } from '../types/lms';
import { downloadMaterialHandout, toBengaliDigits } from '../utils/lmsHelpers';

interface MaterialsLibraryViewProps {
  courses: Course[];
  readMaterialIds: string[];
  onMarkMaterialRead: (materialId: string) => void;
  onOpenLessonInClassroom: (courseId: string, lessonId: string) => void;
}

interface MaterialEntry {
  course: Course;
  lesson: Lesson;
}

export const MaterialsLibraryView: React.FC<MaterialsLibraryViewProps> = ({
  courses,
  readMaterialIds,
  onMarkMaterialRead,
  onOpenLessonInClassroom
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    courses[0].lessons[0].material.id
  );

  const allMaterials: MaterialEntry[] = useMemo(
    () =>
      courses.flatMap((course) =>
        course.lessons.map((lesson) => ({ course, lesson }))
      ),
    [courses]
  );

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allMaterials.filter(({ course, lesson }) => {
      const matchesCat =
        categoryFilter === 'all' || course.category === categoryFilter;
      const matchesSearch =
        !q ||
        lesson.material.title.toLowerCase().includes(q) ||
        lesson.material.summary.toLowerCase().includes(q) ||
        course.title.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [allMaterials, categoryFilter, searchQuery]);

  const activeEntry =
    filteredMaterials.find(
      (entry) => entry.lesson.material.id === selectedMaterialId
    ) ??
    filteredMaterials[0] ??
    allMaterials[0];

  const readCount = allMaterials.filter((e) =>
    readMaterialIds.includes(e.lesson.material.id)
  ).length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#DDE5DF]">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl font-bold text-[#132219] tracking-tight">
            শিক্ষক প্রশিক্ষণ উপকরণ ও লেসন প্ল্যান লাইব্রেরি
          </h1>
          <p className="text-sm sm:text-base text-[#4A5D52]">
            শ্রেণিকক্ষে পাঠদানের জন্য TPACK গাইড, 5E লেসন প্ল্যান, মূল্যায়ন রুব্রিক ও অ্যাকশন রিসার্চ ওয়ার্কশিট পড়ুন এবং হ্যান্ডআউট ডাউনলোড করুন।
          </p>
        </div>

        <div className="text-sm font-mono tabular-nums text-[#15803D] font-semibold shrink-0">
          পঠিত উপকরণ: {toBengaliDigits(readCount)} / {toBengaliDigits(allMaterials.length)}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EBF1EC] border border-[#DDE5DF] rounded-lg w-fit">
          {(
            [
              { id: 'all', label: 'সকল মডিউল' },
              { id: 'tpack-tech', label: 'টিপ্যাক ও প্রযুক্তি' },
              { id: 'pedagogy-eval', label: 'পেডাগজি ও মূল্যায়ন' },
              { id: 'research-leadership', label: 'গবেষণা ও নেতৃত্ব' }
            ] as { id: CourseCategory; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-white text-[#132219] shadow-xs font-semibold'
                  : 'text-[#4A5D52] hover:text-[#132219]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="w-4 h-4 text-[#4A5D52] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="লেসন প্ল্যান বা রুব্রিক খুঁজুন..."
            aria-label="প্রশিক্ষণ উপকরণ খুঁজুন"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#DDE5DF] rounded-lg text-[#132219] placeholder:text-[#7A8D81] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
          />
        </div>
      </div>

      {/* Empty State vs Populated Split View */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white border border-[#DDE5DF] rounded-xl p-12 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-[#4A5D52] mx-auto" />
          <h2 className="text-lg font-semibold text-[#132219]">
            কোনো প্রশিক্ষণ উপকরণ পাওয়া যায়নি
          </h2>
          <p className="text-sm text-[#4A5D52]">
            অনুগ্রহ করে অন্য কিওয়ার্ড দিয়ে খুঁজুন অথবা সব ফিল্টার রিসেট করুন।
          </p>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-[#15803D] rounded-lg hover:bg-[#166534] cursor-pointer"
          >
            সব উপকরণ দেখান
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Material Index List */}
          <div className="lg:col-span-5 bg-white border border-[#DDE5DF] rounded-xl divide-y divide-[#EDF1EE] overflow-hidden">
            {filteredMaterials.map(({ course, lesson }) => {
              const isSelected =
                activeEntry.lesson.material.id === lesson.material.id;
              const isRead = readMaterialIds.includes(lesson.material.id);
              return (
                <button
                  key={lesson.material.id}
                  type="button"
                  onClick={() => setSelectedMaterialId(lesson.material.id)}
                  className={`w-full text-left p-4 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#ECF2ED]' : 'hover:bg-[#F6F8F6]'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs text-[#4A5D52] flex items-center gap-1.5 truncate">
                      <span>{course.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lesson.material.formatLabel}</span>
                    </div>
                    <div
                      className={`text-sm leading-snug ${
                        isSelected
                          ? 'font-bold text-[#132219]'
                          : 'font-semibold text-[#2C3E33]'
                      }`}
                    >
                      {lesson.material.title}
                    </div>
                  </div>
                  {isRead && (
                    <CheckCircle2
                      className="w-4 h-4 text-[#15803D] shrink-0 mt-1"
                      aria-label="পঠিত"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Material Reader Pane */}
          <div className="lg:col-span-7 bg-white border border-[#DDE5DF] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2 pb-5 border-b border-[#EDF1EE]">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5D52]">
                <span>{activeEntry.course.title}</span>
                <span aria-hidden="true">·</span>
                <span>{activeEntry.lesson.number}</span>
                <span aria-hidden="true">·</span>
                <span>{activeEntry.lesson.material.readTime}</span>
              </div>
              <h2 className="text-2xl font-bold text-[#132219]">
                {activeEntry.lesson.material.title}
              </h2>
            </div>

            <p className="text-[15px] leading-relaxed text-[#2C3E33]">
              {activeEntry.lesson.material.summary}
            </p>

            {/* Classroom Activity Box */}
            <div className="p-4 rounded-lg bg-[#ECF2ED]/60 border border-[#D4E3D8] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-[#4A5D52]">উপযোগী শ্রেণি</div>
                <div className="text-xs font-semibold text-[#132219] mt-0.5">
                  {activeEntry.lesson.material.classroomActivity.gradeLevel}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#4A5D52]">পিরিয়ড সময়</div>
                <div className="text-xs font-semibold text-[#132219] mt-0.5">
                  {activeEntry.lesson.material.classroomActivity.duration}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#4A5D52]">মূল শিখনফল</div>
                <div className="text-xs font-medium text-[#132219] mt-0.5">
                  {activeEntry.lesson.material.classroomActivity.objective}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#132219]">
                শিক্ষণ কৌশল ও মূল সারসংক্ষেপ
              </h3>
              <ul className="space-y-2.5">
                {activeEntry.lesson.material.keyPoints.map((pt, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm leading-relaxed text-[#2C3E33]"
                  >
                    <span className="font-mono tabular-nums text-xs font-semibold text-[#15803D] mt-0.5">
                      ০{toBengaliDigits(idx + 1)}.
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {activeEntry.lesson.material.formulaOrMetric && (
              <div className="p-4 rounded-lg bg-[#F6F8F6] border border-[#DDE5DF] space-y-1">
                <div className="text-xs font-semibold text-[#15803D]">
                  {activeEntry.lesson.material.formulaOrMetric.label}
                </div>
                <div className="font-mono text-sm font-semibold text-[#132219]">
                  {activeEntry.lesson.material.formulaOrMetric.expression}
                </div>
                <div className="text-xs text-[#4A5D52]">
                  {activeEntry.lesson.material.formulaOrMetric.note}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#132219]">
                শ্রেণিকক্ষ প্রস্তুতি চেকলিস্ট
              </h3>
              <ul className="space-y-1.5 text-sm text-[#2C3E33]">
                {activeEntry.lesson.material.actionChecklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-[#15803D] font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Actions */}
            <div className="pt-5 border-t border-[#EDF1EE] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    downloadMaterialHandout(
                      activeEntry.course.title,
                      activeEntry.lesson
                    );
                    onMarkMaterialRead(activeEntry.lesson.material.id);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>হ্যান্ডআউট ডাউনলোড (.TXT)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onMarkMaterialRead(activeEntry.lesson.material.id)
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#132219] bg-[#F6F8F6] hover:bg-[#E8EFEA] border border-[#DDE5DF] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>
                    {readMaterialIds.includes(activeEntry.lesson.material.id)
                      ? 'পঠিত হিসেবে সংরক্ষিত'
                      : 'পঠিত চিহ্নিত করুন'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  onOpenLessonInClassroom(
                    activeEntry.course.id,
                    activeEntry.lesson.id
                  )
                }
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D] hover:underline cursor-pointer"
              >
                <span>ভিডিও লেসনে যান</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
