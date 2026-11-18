import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Leaf,
  PlayCircle,
  Search,
  Trophy,
  X
} from 'lucide-react';
import {
  COURSES,
  CPD_DEADLINES,
  HERO_IMAGE_PATH,
  TRAINING_SESSIONS
} from './data/coursesData';
import { evaluateAchievements } from './data/achievementsData';
import {
  CourseCategory,
  DiscussionPost,
  DiscussionPostType,
  DiscussionReply,
  EvaluatedAchievement,
  LearnerProgress,
  NavTab,
  QuizResult
} from './types/lms';
import { TopBar } from './components/TopBar';
import { EcoImage } from './components/EcoImage';
import { ClassroomView } from './components/ClassroomView';
import { MaterialsLibraryView } from './components/MaterialsLibraryView';
import { QuizCenterView } from './components/QuizCenterView';
import { AchievementsView } from './components/AchievementsView';
import { AchievementBadgeEmblem } from './components/AchievementBadgeEmblem';
import { LearningDashboard } from './components/LearningDashboard';
import { TeacherLeaderboard } from './components/TeacherLeaderboard';
import { CertificateStudioView } from './components/CertificateStudioView';
import { ProfileModal } from './components/ProfileModal';
import { TrainingScheduleSection } from './components/TrainingScheduleSection';
import { TeacherTrainingCalendarView } from './components/TeacherTrainingCalendarView';
import { getLocalDateKey, toBengaliDigits } from './utils/lmsHelpers';

const STORAGE_KEY = 'tpack-academy-lms-v1';

const DEFAULT_PROGRESS: LearnerProgress = {
  learnerName: 'মো. রাফিউল ইসলাম',
  designation: 'সহকারী শিক্ষক (বিজ্ঞান)',
  schoolName: 'সবুজপুর আদর্শ উচ্চ বিদ্যালয়',
  completedLessonIds: [],
  readMaterialIds: [],
  registeredSessionIds: [],
  quizResults: {},
  unlockedAchievementDates: {},
  lessonNotes: {},
  studySecondsByDate: {},
  activityCountByDate: {},
  customDiscussionPosts: [],
  customDiscussionReplies: {},
  helpfulDiscussionIds: []
};

function loadProgress(): LearnerProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<LearnerProgress>;
    return {
      learnerName:
        typeof parsed.learnerName === 'string'
          ? parsed.learnerName
          : DEFAULT_PROGRESS.learnerName,
      designation:
        typeof parsed.designation === 'string'
          ? parsed.designation
          : DEFAULT_PROGRESS.designation,
      schoolName:
        typeof parsed.schoolName === 'string'
          ? parsed.schoolName
          : DEFAULT_PROGRESS.schoolName,
      completedLessonIds: Array.isArray(parsed.completedLessonIds)
        ? parsed.completedLessonIds
        : [],
      readMaterialIds: Array.isArray(parsed.readMaterialIds)
        ? parsed.readMaterialIds
        : [],
      registeredSessionIds: Array.isArray(parsed.registeredSessionIds)
        ? parsed.registeredSessionIds
        : [],
      quizResults:
        parsed.quizResults && typeof parsed.quizResults === 'object'
          ? parsed.quizResults
          : {},
      unlockedAchievementDates:
        parsed.unlockedAchievementDates &&
        typeof parsed.unlockedAchievementDates === 'object'
          ? parsed.unlockedAchievementDates
          : {},
      lessonNotes:
        parsed.lessonNotes && typeof parsed.lessonNotes === 'object'
          ? parsed.lessonNotes
          : {},
      studySecondsByDate:
        parsed.studySecondsByDate &&
        typeof parsed.studySecondsByDate === 'object'
          ? parsed.studySecondsByDate
          : {},
      activityCountByDate:
        parsed.activityCountByDate &&
        typeof parsed.activityCountByDate === 'object'
          ? parsed.activityCountByDate
          : {},
      customDiscussionPosts: Array.isArray(parsed.customDiscussionPosts)
        ? parsed.customDiscussionPosts
        : [],
      customDiscussionReplies:
        parsed.customDiscussionReplies &&
        typeof parsed.customDiscussionReplies === 'object'
          ? parsed.customDiscussionReplies
          : {},
      helpfulDiscussionIds: Array.isArray(parsed.helpfulDiscussionIds)
        ? parsed.helpfulDiscussionIds
        : []
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('courses');
  const [activeCourseId, setActiveCourseId] = useState<string>(COURSES[0].id);
  const [activeLessonId, setActiveLessonId] = useState<string>(
    COURSES[0].lessons[0].id
  );
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [progress, setProgress] = useState<LearnerProgress>(loadProgress);
  const [unlockedToast, setUnlockedToast] =
    useState<EvaluatedAchievement | null>(null);
  const prevUnlockedRef = useRef<Set<string> | null>(null);

  const evaluatedAchievements = useMemo(
    () => evaluateAchievements(progress, COURSES),
    [progress]
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  // Record earned dates & show non-intrusive toast when a new badge is unlocked
  useEffect(() => {
    const currentlyUnlocked = evaluatedAchievements.filter(
      (a) => a.status.unlocked
    );
    const currentSet = new Set(currentlyUnlocked.map((a) => a.id));

    if (prevUnlockedRef.current === null) {
      prevUnlockedRef.current = currentSet;
      // Backfill missing earned dates on first evaluation if pre-existing progress exists
      const missingDates = currentlyUnlocked.filter(
        (a) => !progress.unlockedAchievementDates?.[a.id]
      );
      if (missingDates.length > 0) {
        const todayBn = new Date().toLocaleDateString('bn-BD', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setProgress((prev) => {
          const nextDates = { ...(prev.unlockedAchievementDates ?? {}) };
          missingDates.forEach((a) => {
            if (!nextDates[a.id]) nextDates[a.id] = todayBn;
          });
          return { ...prev, unlockedAchievementDates: nextDates };
        });
      }
      return;
    }

    const newlyUnlocked = currentlyUnlocked.filter(
      (a) => !prevUnlockedRef.current!.has(a.id)
    );
    prevUnlockedRef.current = currentSet;

    if (newlyUnlocked.length > 0) {
      const todayBn = new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setProgress((prev) => {
        const nextDates = { ...(prev.unlockedAchievementDates ?? {}) };
        newlyUnlocked.forEach((a) => {
          if (!nextDates[a.id]) nextDates[a.id] = todayBn;
        });
        return { ...prev, unlockedAchievementDates: nextDates };
      });
      setUnlockedToast(newlyUnlocked[0]);
    }
  }, [evaluatedAchievements, progress.unlockedAchievementDates]);

  useEffect(() => {
    if (!unlockedToast) return;
    const timer = window.setTimeout(() => setUnlockedToast(null), 6500);
    return () => window.clearTimeout(timer);
  }, [unlockedToast]);

  const activeCourse =
    COURSES.find((c) => c.id === activeCourseId) ?? COURSES[0];

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return COURSES.filter((course) => {
      const catMatch =
        categoryFilter === 'all' || course.category === categoryFilter;
      const searchMatch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.subtitle.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [categoryFilter, searchQuery]);

  const totalLessonsCount = COURSES.reduce(
    (sum, c) => sum + c.lessons.length,
    0
  );
  const earnedCertificatesCount = Object.values(progress.quizResults).filter(
    (r) => r.passed
  ).length;
  const earnedBadgesCount = evaluatedAchievements.filter(
    (a) => a.status.unlocked
  ).length;

  const handleOpenCourse = (courseId: string, lessonId?: string) => {
    const targetCourse = COURSES.find((c) => c.id === courseId) ?? COURSES[0];
    setActiveCourseId(targetCourse.id);
    setActiveLessonId(lessonId ?? targetCourse.lessons[0].id);
    setActiveTab('classroom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStudySecondsTick = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    const todayKey = getLocalDateKey();
    setProgress((prev) => ({
      ...prev,
      studySecondsByDate: {
        ...(prev.studySecondsByDate ?? {}),
        [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + seconds
      }
    }));
  }, []);

  const handleLogPracticeMinutes = useCallback((minutes: number) => {
    if (minutes <= 0) return;
    const todayKey = getLocalDateKey();
    setProgress((prev) => ({
      ...prev,
      studySecondsByDate: {
        ...(prev.studySecondsByDate ?? {}),
        [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + minutes * 60
      },
      activityCountByDate: {
        ...(prev.activityCountByDate ?? {}),
        [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
      }
    }));
  }, []);

  const handleToggleLessonComplete = (lessonId: string) => {
    const todayKey = getLocalDateKey();
    setProgress((prev) => {
      const exists = prev.completedLessonIds.includes(lessonId);
      if (exists) {
        return {
          ...prev,
          completedLessonIds: prev.completedLessonIds.filter(
            (id) => id !== lessonId
          )
        };
      }
      return {
        ...prev,
        completedLessonIds: [...prev.completedLessonIds, lessonId],
        studySecondsByDate: {
          ...(prev.studySecondsByDate ?? {}),
          [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + 180
        },
        activityCountByDate: {
          ...(prev.activityCountByDate ?? {}),
          [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
        }
      };
    });
  };

  const handleMarkMaterialRead = (materialId: string) => {
    const todayKey = getLocalDateKey();
    setProgress((prev) => {
      if (prev.readMaterialIds.includes(materialId)) return prev;
      return {
        ...prev,
        readMaterialIds: [...prev.readMaterialIds, materialId],
        studySecondsByDate: {
          ...(prev.studySecondsByDate ?? {}),
          [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + 300
        },
        activityCountByDate: {
          ...(prev.activityCountByDate ?? {}),
          [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
        }
      };
    });
  };

  const handleCompleteQuiz = (result: QuizResult) => {
    const todayKey = getLocalDateKey();
    setProgress((prev) => {
      const prevBest = prev.quizResults[result.courseId];
      const shouldKeepBest =
        prevBest && prevBest.passed && prevBest.score > result.score;
      return {
        ...prev,
        quizResults: {
          ...prev.quizResults,
          [result.courseId]: shouldKeepBest ? prevBest : result
        },
        studySecondsByDate: {
          ...(prev.studySecondsByDate ?? {}),
          [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + 300
        },
        activityCountByDate: {
          ...(prev.activityCountByDate ?? {}),
          [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
        }
      };
    });
  };

  const handleToggleSessionRegister = (sessionId: string) => {
    setProgress((prev) => {
      const exists = prev.registeredSessionIds.includes(sessionId);
      return {
        ...prev,
        registeredSessionIds: exists
          ? prev.registeredSessionIds.filter((id) => id !== sessionId)
          : [...prev.registeredSessionIds, sessionId]
      };
    });
  };

  const handleSaveLessonNote = useCallback((lessonId: string, content: string) => {
    const todayKey = getLocalDateKey();
    const updatedAt = new Date().toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    setProgress((prev) => {
      const isNewNote = !prev.lessonNotes?.[lessonId]?.content?.trim();
      return {
        ...prev,
        lessonNotes: {
          ...(prev.lessonNotes ?? {}),
          [lessonId]: {
            content,
            updatedAt
          }
        },
        ...(isNewNote
          ? {
              studySecondsByDate: {
                ...(prev.studySecondsByDate ?? {}),
                [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + 180
              },
              activityCountByDate: {
                ...(prev.activityCountByDate ?? {}),
                [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
              }
            }
          : {})
      };
    });
  }, []);

  const handleDeleteLessonNote = useCallback((lessonId: string) => {
    setProgress((prev) => {
      const nextNotes = { ...(prev.lessonNotes ?? {}) };
      delete nextNotes[lessonId];
      return {
        ...prev,
        lessonNotes: nextNotes
      };
    });
  }, []);

  const handleCreateDiscussionPost = useCallback(
    (input: {
      courseId: string;
      lessonId: string;
      type: DiscussionPostType;
      title: string;
      body: string;
    }) => {
      const todayKey = getLocalDateKey();
      const createdAt = new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setProgress((prev) => {
        const newPost: DiscussionPost = {
          id: `disc-own-${Date.now()}`,
          courseId: input.courseId,
          lessonId: input.lessonId,
          type: input.type,
          title: input.title,
          body: input.body,
          authorName: prev.learnerName.trim() || 'সম্মানিত শিক্ষক',
          authorRole: prev.designation.trim() || 'শিক্ষক',
          schoolName: prev.schoolName.trim() || undefined,
          createdAt,
          helpfulCount: 0,
          replies: [],
          isOwn: true
        };
        return {
          ...prev,
          customDiscussionPosts: [newPost, ...(prev.customDiscussionPosts ?? [])],
          activityCountByDate: {
            ...(prev.activityCountByDate ?? {}),
            [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
          }
        };
      });
    },
    []
  );

  const handleDeleteDiscussionPost = useCallback((postId: string) => {
    setProgress((prev) => {
      const nextReplies = { ...(prev.customDiscussionReplies ?? {}) };
      delete nextReplies[postId];
      return {
        ...prev,
        customDiscussionPosts: (prev.customDiscussionPosts ?? []).filter(
          (p) => p.id !== postId
        ),
        customDiscussionReplies: nextReplies
      };
    });
  }, []);

  const handleAddDiscussionReply = useCallback((postId: string, body: string) => {
    const todayKey = getLocalDateKey();
    const createdAt = new Date().toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    setProgress((prev) => {
      const newReply: DiscussionReply = {
        id: `rep-own-${Date.now()}`,
        authorName: prev.learnerName.trim() || 'সম্মানিত শিক্ষক',
        authorRole: prev.designation.trim() || 'সহকর্মী শিক্ষক',
        body,
        createdAt,
        isOwn: true
      };
      const existing = prev.customDiscussionReplies?.[postId] ?? [];
      return {
        ...prev,
        customDiscussionReplies: {
          ...(prev.customDiscussionReplies ?? {}),
          [postId]: [...existing, newReply]
        },
        activityCountByDate: {
          ...(prev.activityCountByDate ?? {}),
          [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
        }
      };
    });
  }, []);

  const handleToggleDiscussionHelpful = useCallback((postId: string) => {
    setProgress((prev) => {
      const current = prev.helpfulDiscussionIds ?? [];
      const exists = current.includes(postId);
      return {
        ...prev,
        helpfulDiscussionIds: exists
          ? current.filter((id) => id !== postId)
          : [...current, postId]
      };
    });
  }, []);

  const handleResetProgress = () => {
    prevUnlockedRef.current = new Set();
    setUnlockedToast(null);
    setProgress((prev) => ({
      learnerName: prev.learnerName,
      designation: prev.designation,
      schoolName: prev.schoolName,
      completedLessonIds: [],
      readMaterialIds: [],
      registeredSessionIds: [],
      quizResults: {},
      unlockedAchievementDates: {},
      lessonNotes: prev.lessonNotes ?? {},
      studySecondsByDate: {},
      activityCountByDate: {},
      customDiscussionPosts: prev.customDiscussionPosts ?? [],
      customDiscussionReplies: prev.customDiscussionReplies ?? {},
      helpfulDiscussionIds: prev.helpfulDiscussionIds ?? []
    }));
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F6F8F6] text-[#132219]">
      <TopBar
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'courses' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
            {/* Hero Split Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6 bg-white border border-[#DDE5DF] rounded-xl p-7 sm:p-10 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="text-xs font-medium text-[#15803D]">
                    TPACK Academy · শিক্ষক পেশাগত দক্ষতা উন্নয়ন (CPD) প্ল্যাটফর্ম
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#132219] leading-[1.18] tracking-tight [text-wrap:balance]">
                    শিক্ষকদের পেশাগত দক্ষতা উন্নয়নের আধুনিক প্রশিক্ষণ প্ল্যাটফর্ম
                  </h1>
                  <p className="text-base text-[#4A5D52] leading-relaxed max-w-[60ch]">
                    TPACK ফ্রেমওয়ার্ক, আধুনিক পেডাগজি, গঠনমূলক মূল্যায়ন রুব্রিক এবং শ্রেণিকক্ষ অ্যাকশন রিসার্চের ওপর সাজানো ভিডিও মডিউল, ডাউনলোডযোগ্য লেসন প্ল্যান ও CPD সার্টিফিকেট।
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCourse(COURSES[0].id)}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                  >
                    <span>প্রশিক্ষণ শুরু করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('certificate')}
                    className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#132219] bg-[#F6F8F6] hover:bg-[#E8EFEA] border border-[#DDE5DF] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-[#15803D]" />
                    <span>CPD সার্টিফিকেট</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-xl overflow-hidden border border-[#DDE5DF] bg-white min-h-[280px]">
                <EcoImage
                  src={HERO_IMAGE_PATH}
                  alt="TPACK Academy শিক্ষক প্রশিক্ষণ ও সহযোগিতামূলক শিক্ষণ স্টুডিও"
                  fallbackLabel="TPACK Academy শিক্ষক প্রশিক্ষণ কেন্দ্র"
                  className="w-full h-full lg:h-full object-cover block"
                />
              </div>
            </section>

            {/* 4-Column KPI Summary Strip directly below Hero Split */}
            <section
              aria-label="প্রশিক্ষণ পরিসংখ্যান"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="bg-white border border-[#DDE5DF] rounded-xl p-5 flex items-start gap-3.5">
                <PlayCircle className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
                    {toBengaliDigits(COURSES.length)}টি শিক্ষক কোর্স
                  </div>
                  <div className="text-xs text-[#4A5D52] mt-0.5">
                    মোট ৩২ CPD ঘণ্টার স্বীকৃত কারিকুলাম
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#DDE5DF] rounded-xl p-5 flex items-start gap-3.5">
                <BookOpen className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
                    {toBengaliDigits(progress.completedLessonIds.length)}/{toBengaliDigits(totalLessonsCount)} মডিউল সম্পন্ন
                  </div>
                  <div className="text-xs text-[#4A5D52] mt-0.5">
                    ভিডিও ডেমো ও রেডি-টু-ইউজ লেসন প্ল্যান
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#DDE5DF] rounded-xl p-5 flex items-start gap-3.5">
                <ClipboardCheck className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
                    {toBengaliDigits(COURSES.length)}টি দক্ষতা মূল্যায়ন
                  </div>
                  <div className="text-xs text-[#4A5D52] mt-0.5">
                    পেডাগজি ও শ্রেণিকক্ষ প্রয়োগভিত্তিক কুইজ
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#DDE5DF] rounded-xl p-5 flex items-start gap-3.5">
                <Award className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
                    {toBengaliDigits(earnedCertificatesCount)}/{toBengaliDigits(COURSES.length)} CPD সনদ
                  </div>
                  <div className="text-xs text-[#4A5D52] mt-0.5">
                    পদবি ও বিদ্যালয়ের নামসহ PNG/PDF
                  </div>
                </div>
              </div>
            </section>

            {/* Learning Dashboard: Total Study Time & Weekly Activity Bar Chart */}
            <LearningDashboard
              courses={COURSES}
              progress={progress}
              onLogPracticeMinutes={handleLogPracticeMinutes}
              onOpenCourse={(courseId, lessonId) =>
                handleOpenCourse(courseId, lessonId)
              }
            />

            {/* Teacher Leaderboard: Top Performers by Study Time & Completed Quiz Modules */}
            <TeacherLeaderboard
              courses={COURSES}
              progress={progress}
              onGoToQuiz={() => {
                setActiveTab('quiz');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenClassroom={() => handleOpenCourse(activeCourse.id)}
            />

            {/* Course Catalog Section */}
            <section id="catalog" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#DDE5DF]">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-[#132219] tracking-tight">
                    শিক্ষক প্রশিক্ষণ মডিউলসমূহ
                  </h2>
                  <p className="text-sm text-[#4A5D52]">
                    ডিজিটাল শিক্ষণ, আধুনিক পেডাগজি ও নেতৃত্বের দক্ষতা বাড়াতে পছন্দের প্রশিক্ষণ কোর্সে প্রবেশ করুন।
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-72">
                  <Search
                    className="w-4 h-4 text-[#4A5D52] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="প্রশিক্ষণ কোর্স খুঁজুন..."
                    aria-label="প্রশিক্ষণ কোর্স খুঁজুন"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#DDE5DF] rounded-lg text-[#132219] placeholder:text-[#7A8D81] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                </div>
              </div>

              {/* Interactive Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EBF1EC] border border-[#DDE5DF] rounded-lg w-fit">
                {(
                  [
                    { id: 'all', label: 'সব মডিউল' },
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

              {/* Course Grid */}
              {filteredCourses.length === 0 ? (
                <div className="bg-white border border-[#DDE5DF] rounded-xl p-12 text-center space-y-3">
                  <Leaf className="w-8 h-8 text-[#4A5D52] mx-auto" />
                  <h3 className="text-lg font-semibold text-[#132219]">
                    কোনো প্রশিক্ষণ কোর্স খুঁজে পাওয়া যায়নি
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#15803D] rounded-lg cursor-pointer"
                  >
                    সব মডিউল দেখান
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => {
                    const completedCount = course.lessons.filter((l) =>
                      progress.completedLessonIds.includes(l.id)
                    ).length;
                    const pct = Math.round(
                      (completedCount / course.lessons.length) * 100
                    );
                    const quizRes = progress.quizResults[course.id];

                    return (
                      <article
                        key={course.id}
                        className="bg-white border border-[#DDE5DF] rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
                      >
                        <div>
                          <div className="aspect-[4/3] bg-[#E8EFEA] overflow-hidden border-b border-[#EDF1EE]">
                            <EcoImage
                              src={course.imagePath}
                              alt={course.title}
                              fallbackLabel={course.title}
                              className="w-full h-full object-cover block"
                            />
                          </div>

                          <div className="p-6 space-y-3">
                            {/* Unboxed Metadata with typographic separators */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#4A5D52]">
                              <span className="font-medium text-[#15803D]">
                                {course.categoryLabel}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{course.totalDurationLabel}</span>
                              <span aria-hidden="true">·</span>
                              <span>{course.levelLabel}</span>
                            </div>

                            <h3 className="text-xl font-bold text-[#132219] leading-snug">
                              {course.title}
                            </h3>

                            <p className="text-sm text-[#4A5D52] leading-relaxed">
                              {course.description}
                            </p>
                          </div>
                        </div>

                        <div className="px-6 pb-6 pt-2 space-y-4">
                          {/* Course Progress Indicator */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-[#4A5D52]">
                              <span className="font-mono tabular-nums">
                                অগ্রগতি: {toBengaliDigits(completedCount)}/{toBengaliDigits(course.lessons.length)} মডিউল ({toBengaliDigits(pct)}%)
                              </span>
                              {quizRes?.passed && (
                                <span className="inline-flex items-center gap-1 font-semibold text-[#15803D]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>CPD সনদ অর্জিত</span>
                                </span>
                              )}
                            </div>
                            <div className="w-full h-1.5 bg-[#E8EFEA] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#15803D] transition-transform duration-300 origin-left"
                                style={{ transform: `scaleX(${pct / 100})` }}
                              />
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleOpenCourse(course.id)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
                            >
                              <PlayCircle className="w-4 h-4" />
                              <span>
                                {completedCount > 0 ? 'প্রশিক্ষণ চালিয়ে যান' : 'প্রশিক্ষণে প্রবেশ'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveCourseId(course.id);
                                setActiveTab(
                                  quizRes?.passed ? 'certificate' : 'quiz'
                                );
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-[#132219] bg-[#F6F8F6] hover:bg-[#E8EFEA] border border-[#DDE5DF] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
                            >
                              {quizRes?.passed ? (
                                <>
                                  <Award className="w-4 h-4 text-[#15803D]" />
                                  <span>সনদ</span>
                                </>
                              ) : (
                                <>
                                  <ClipboardCheck className="w-4 h-4 text-[#15803D]" />
                                  <span>কুইজ</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Learning Achievements Preview Band */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#DDE5DF]">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-[#15803D]">
                    Learning Achievements · ডিজিটাল দক্ষতা ব্যাজ
                  </div>
                  <h2 className="text-2xl font-bold text-[#132219] tracking-tight">
                    শিখন অর্জন ও সম্মাননা ব্যাজ ({toBengaliDigits(earnedBadgesCount)}/
                    {toBengaliDigits(evaluatedAchievements.length)})
                  </h2>
                  <p className="text-sm text-[#4A5D52]">
                    কোর্স মডিউল সম্পন্ন করে এবং কুইজে উচ্চ নম্বর অর্জন করে আপনার পেশাগত ডিজিটাল ব্যাজ সংগ্রহ করুন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('achievements');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#132219] bg-white hover:bg-[#ECF2ED] border border-[#DDE5DF] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-[#B45309]" />
                  <span>সব ব্যাজ ও অগ্রগতি দেখুন</span>
                  <ArrowRight className="w-4 h-4 text-[#15803D]" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  'tech-savvy-educator',
                  'pedagogy-pro',
                  'quiz-ace'
                ]
                  .map((id) => evaluatedAchievements.find((a) => a.id === id))
                  .filter((a): a is EvaluatedAchievement => Boolean(a))
                  .map((badge) => (
                    <div
                      key={badge.id}
                      className={`bg-white border rounded-xl p-5 flex flex-col justify-between gap-4 ${
                        badge.status.unlocked
                          ? 'border-[#15803D]/50'
                          : 'border-[#DDE5DF]'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <AchievementBadgeEmblem
                          iconKey={badge.iconKey}
                          tier={badge.tier}
                          unlocked={badge.status.unlocked}
                          size="md"
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="text-xs text-[#4A5D52] flex items-center gap-1.5">
                            <span className="font-medium text-[#15803D]">
                              {badge.tierLabel}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {badge.status.unlocked ? 'অর্জিত' : 'লক করা'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold font-display text-[#132219] leading-snug">
                            {badge.titleEn}
                          </h3>
                          <div className="text-xs font-semibold text-[#2C3E33]">
                            {badge.titleBn}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#EDF1EE]">
                        <div className="flex items-center justify-between text-xs text-[#4A5D52]">
                          <span>{badge.criteriaLabel}</span>
                          <span className="font-mono tabular-nums font-semibold text-[#132219] shrink-0 ml-2">
                            {toBengaliDigits(badge.status.percentage)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#E8EFEA] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-transform duration-300 origin-left ${
                              badge.status.unlocked
                                ? badge.tier === 'gold'
                                  ? 'bg-[#B45309]'
                                  : 'bg-[#15803D]'
                                : 'bg-[#6A9E7D]'
                            }`}
                            style={{
                              transform: `scaleX(${badge.status.percentage / 100})`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <TrainingScheduleSection
              sessions={TRAINING_SESSIONS}
              registeredSessionIds={progress.registeredSessionIds}
              onToggleRegister={handleToggleSessionRegister}
              onOpenCourse={(courseId) => handleOpenCourse(courseId)}
              onOpenFullCalendar={() => {
                setActiveTab('calendar');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {activeTab === 'classroom' && (
          <ClassroomView
            course={activeCourse}
            activeLessonId={activeLessonId}
            teacherName={progress.learnerName}
            teacherDesignation={progress.designation}
            teacherSchool={progress.schoolName}
            completedLessonIds={progress.completedLessonIds}
            readMaterialIds={progress.readMaterialIds}
            lessonNotes={progress.lessonNotes ?? {}}
            customDiscussionPosts={progress.customDiscussionPosts ?? []}
            customDiscussionReplies={progress.customDiscussionReplies ?? {}}
            helpfulDiscussionIds={progress.helpfulDiscussionIds ?? []}
            quizResult={progress.quizResults[activeCourse.id]}
            onSelectLesson={setActiveLessonId}
            onToggleLessonComplete={handleToggleLessonComplete}
            onMarkMaterialRead={handleMarkMaterialRead}
            onSaveLessonNote={handleSaveLessonNote}
            onDeleteLessonNote={handleDeleteLessonNote}
            onCreateDiscussionPost={handleCreateDiscussionPost}
            onDeleteDiscussionPost={handleDeleteDiscussionPost}
            onAddDiscussionReply={handleAddDiscussionReply}
            onToggleDiscussionHelpful={handleToggleDiscussionHelpful}
            onStudySecondsTick={handleStudySecondsTick}
            onBackToCatalog={() => setActiveTab('courses')}
            onGoToQuiz={() => setActiveTab('quiz')}
            onGoToCertificate={() => setActiveTab('certificate')}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsLibraryView
            courses={COURSES}
            readMaterialIds={progress.readMaterialIds}
            onMarkMaterialRead={handleMarkMaterialRead}
            onOpenLessonInClassroom={(courseId, lessonId) =>
              handleOpenCourse(courseId, lessonId)
            }
          />
        )}

        {activeTab === 'quiz' && (
          <QuizCenterView
            courses={COURSES}
            selectedCourseId={activeCourseId}
            quizResults={progress.quizResults}
            achievements={evaluatedAchievements}
            onSelectCourse={setActiveCourseId}
            onCompleteQuiz={handleCompleteQuiz}
            onOpenCertificate={(courseId) => {
              setActiveCourseId(courseId);
              setActiveTab('certificate');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAchievements={() => {
              setActiveTab('achievements');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <TeacherTrainingCalendarView
            sessions={TRAINING_SESSIONS}
            deadlines={CPD_DEADLINES}
            progress={progress}
            onToggleRegister={handleToggleSessionRegister}
            onNavigateToAction={(tab, courseId) => {
              if (courseId) {
                const targetCourse =
                  COURSES.find((c) => c.id === courseId) ?? COURSES[0];
                setActiveCourseId(targetCourse.id);
                setActiveLessonId(targetCourse.lessons[0].id);
              }
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsView
            achievements={evaluatedAchievements}
            progress={progress}
            onNavigateToAction={(tab, courseId) => {
              if (courseId) {
                const targetCourse =
                  COURSES.find((c) => c.id === courseId) ?? COURSES[0];
                setActiveCourseId(targetCourse.id);
                setActiveLessonId(targetCourse.lessons[0].id);
              }
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'certificate' && (
          <CertificateStudioView
            courses={COURSES}
            selectedCourseId={activeCourseId}
            learnerName={progress.learnerName}
            designation={progress.designation}
            schoolName={progress.schoolName}
            quizResults={progress.quizResults}
            onSelectCourse={setActiveCourseId}
            onUpdateLearnerName={(name) =>
              setProgress((prev) => ({ ...prev, learnerName: name }))
            }
            onUpdateDesignation={(designation) =>
              setProgress((prev) => ({ ...prev, designation }))
            }
            onUpdateSchoolName={(schoolName) =>
              setProgress((prev) => ({ ...prev, schoolName }))
            }
            onGoToQuiz={(courseId) => {
              setActiveCourseId(courseId);
              setActiveTab('quiz');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-[#DDE5DF] bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4A5D52]">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
            <span>© ২০২৬ TPACK Academy · শিক্ষক পেশাগত দক্ষতা উন্নয়ন ও CPD পোর্টাল</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              কোর্সসমূহ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              লেসন প্ল্যান
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              মূল্যায়ন কুইজ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              প্রশিক্ষণ ক্যালেন্ডার
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('achievements')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              অর্জন ও ব্যাজ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              CPD সনদ
            </button>
          </div>
        </div>
      </footer>

      <ProfileModal
        isOpen={profileOpen}
        courses={COURSES}
        progress={progress}
        achievements={evaluatedAchievements}
        onClose={() => setProfileOpen(false)}
        onUpdateName={(name) =>
          setProgress((prev) => ({ ...prev, learnerName: name }))
        }
        onUpdateDesignation={(designation) =>
          setProgress((prev) => ({ ...prev, designation }))
        }
        onUpdateSchoolName={(schoolName) =>
          setProgress((prev) => ({ ...prev, schoolName }))
        }
        onResetProgress={handleResetProgress}
        onJumpToCourse={(courseId) => handleOpenCourse(courseId)}
        onOpenAchievements={() => {
          setActiveTab('achievements');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Non-intrusive Achievement Unlocked Toast */}
      {unlockedToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] bg-white border border-[#15803D] rounded-xl p-4 shadow-lg flex items-center gap-3.5"
        >
          <AchievementBadgeEmblem
            iconKey={unlockedToast.iconKey}
            tier={unlockedToast.tier}
            unlocked={true}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-[#15803D]">
              নতুন ডিজিটাল ব্যাজ অর্জিত!
            </div>
            <div className="text-sm font-bold font-display text-[#132219] truncate">
              {unlockedToast.titleEn}
            </div>
            <div className="text-xs text-[#4A5D52] truncate">
              {unlockedToast.titleBn}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setUnlockedToast(null);
                setActiveTab('achievements');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md cursor-pointer"
            >
              দেখুন
            </button>
            <button
              type="button"
              onClick={() => setUnlockedToast(null)}
              aria-label="নোটিফিকেশন বন্ধ করুন"
              className="p-1 text-[#4A5D52] hover:text-[#132219] rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
