import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle, Clock, Play, BookOpen, Download, Award, LogOut } from 'lucide-react';
import { generateCompleteRoadmap } from '../services/mainService';
import { generateQuiz } from '../services/quizGenerator';
import { exportRoadmapToPDF, exportProgressReport } from '../utils/exportUtils';

import { useLearning } from '../contexts/LearningContext';
import { useAuth } from '../contexts/AuthContext';
import VideoCard from './VideoCard';
import QuizModal from './QuizModal';
import ProgressChart from './ProgressChart';
import SimpleRoadmapView from './SimpleRoadmapView';
import StudyChatbot from './StudyChatbot';
import CheatSheetModal from './CheatSheetModal';
import { courseCategories } from '../data/courseCategories';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roadmaps, currentRoadmap, progress, dispatch, loading, error } = useLearning();
  const { user, logout } = useAuth();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [viewMode, setViewMode] = useState('detailed');
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Gamification & Cheat Sheet States
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [cheatSheetTopic, setCheatSheetTopic] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const fetchLeaderboard = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/auth/leaderboard`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    }
  };

  const fetchAchievements = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/auth/achievements`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAchievements(data.achievements);
        }
      }
    } catch (e) {
      console.error("Failed to fetch achievements:", e);
    }
  };

  const syncXPWithBackend = async (xpGained, streakValue = undefined) => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/auth/update-xp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ xpGained, streakGained: streakValue }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAchievements(data.achievements);
          fetchLeaderboard();
        }
      }
    } catch (e) {
      console.error("Failed to sync progress:", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
      fetchAchievements();
    }
  }, [user]);

  const openCheatSheet = (topic) => {
    setCheatSheetTopic(topic);
    setShowCheatSheet(true);
  };

  const closeCheatSheet = () => {
    setShowCheatSheet(false);
    setCheatSheetTopic(null);
  };

  // Reset selected day when switching roadmaps
  useEffect(() => {
    setSelectedDay(0);
    setSelectedTopic(null);
  }, [currentRoadmap?.id]);

  // Clear router location state once a roadmap is active to prevent regeneration loops
  useEffect(() => {
    if (currentRoadmap && location.state) {
      navigate('/dashboard', { replace: true, state: null });
    }
  }, [currentRoadmap, location.state, navigate]);

  // Auto-fallback timer
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
      
      // Auto-fallback after 8 seconds
      const autoFallback = setTimeout(async () => {
        if (loading && location.state) {
          console.log('Auto-fallback triggered after 8 seconds');
          const state = location.state;
          const candidates = [state.courseName, state.customCourse, state.subcategory, state.courseType];
          const fallbackName = (candidates.find(v => typeof v === 'string' && v.trim().length > 0) || 'Learning Course').trim();
          const { days, skillLevel, studyHours } = state;
          try {
            // Import the fallback generator
            const { generateCompleteRoadmap } = await import('../services/mainService');
            const fallbackRoadmap = await generateCompleteRoadmap(
              fallbackName,
              days || 7,
              skillLevel || 'Intermediate',
              studyHours || 2
            );
            dispatch({ type: 'SET_ROADMAP', payload: fallbackRoadmap });
          } catch (error) {
            console.error('Auto-fallback failed:', error);
            // Last resort fallback
            const basicFallback = {
              courseName: fallbackName,
              totalDays: days || 7,
              skillLevel: skillLevel || 'Intermediate',
              studyHours: studyHours || 2,
              roadmap: [{
                day: 1,
                topics: [{
                  id: '1_1',
                  title: `Getting Started with ${fallbackName}`,
                  description: 'Begin your learning journey',
                  duration: '2 hours',
                  difficulty: 'Beginner',
                  category: 'Theory',
                  videos: [],
                  completed: false
                }],
                isRevisionDay: false,
                completed: false
              }],
              createdAt: new Date().toISOString(),
              progress: {
                completedDays: 0,
                completedTopics: 0,
                totalTopics: 1,
                quizScore: 0,
                streak: 0,
                xpPoints: 0
              }
            };
            dispatch({ type: 'SET_ROADMAP', payload: basicFallback });
          }
        }
      }, 20000);
      
      return () => {
        clearInterval(timer);
        clearTimeout(autoFallback);
      };
    } else {
      setLoadingTime(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading, location.state, dispatch]);

  useEffect(() => {
    const generateRoadmap = async () => {
      console.log('Dashboard useEffect triggered');
      console.log('Location state:', location.state);
      console.log('Current roadmap:', currentRoadmap);
      
      if (location.state && !currentRoadmap) {
        const selectionData = location.state;
        console.log('Starting roadmap generation with selection data:', selectionData);
        const resolveCourseName = (state) => {
          if (state.courseName) return state.courseName.trim();
          if (state.courseType === 'custom' && state.customCourse) return state.customCourse.trim();
          
          const cat = courseCategories[state.courseType];
          const subcat = cat?.subcategories?.[state.subcategory] || 
                         cat?.branches?.[state.subcategory] || 
                         cat?.categories?.[state.subcategory] || 
                         cat?.providers?.[state.subcategory] || 
                         cat?.languages?.[state.subcategory];
                         
          const subcatName = subcat?.name || state.subcategory;
          
          if (Array.isArray(state.selectedTopics) && state.selectedTopics.length > 0) {
            if (state.selectedTopics.includes('complete')) {
              return subcatName;
            }
            
            const topicNames = state.selectedTopics.map(topicId => {
              if (subcat?.topics) {
                const topicObj = subcat.topics.find(t => t.id === topicId);
                if (topicObj) return topicObj.name;
              }
              if (topicId.startsWith('sem_')) {
                return `Semester ${topicId.replace('sem_', '')}`;
              }
              if (topicId.includes('_')) {
                return topicId.split('_')[1];
              }
              return topicId.charAt(0).toUpperCase() + topicId.slice(1);
            });
            
            return `${subcatName} - ${topicNames.join(', ')}`;
          }
          
          return (subcatName || 'Learning Course').trim();
        };
        const safeCourseName = resolveCourseName(selectionData);
        
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          console.log('Loading state set to true');
          
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Roadmap generation timed out')), 25000)
          );
          
          let roadmapPromise;
          
          // Use universal system for all courses
          console.log('Using universal AI roadmap + video generation');
          const { days, skillLevel, studyHours } = selectionData;
          roadmapPromise = generateCompleteRoadmap(
            safeCourseName,
            days,
            skillLevel || 'Intermediate',
            studyHours || 2
          );
          
          const generatedRoadmap = await Promise.race([roadmapPromise, timeoutPromise]);
          console.log('Roadmap generated successfully:', generatedRoadmap);
          dispatch({ type: 'SET_ROADMAP', payload: generatedRoadmap });
          
        } catch (error) {
          console.error('Dashboard roadmap generation error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to generate roadmap' });
        }
      } else {
        console.log('No state or roadmap generation triggered');
      }
    };

    generateRoadmap();
  }, [location.state, navigate, currentRoadmap, dispatch]);

  const handleDaySelect = async (dayIndex) => {
    setSelectedDay(dayIndex);
    const day = currentRoadmap.roadmap[dayIndex];
    
    // Real-time video loading based on user input and topics
    if (day.topics.some(topic => !topic.videos || topic.videos.length === 0)) {
      setLoadingVideos(true);
      console.log(`🎥 Loading real-time videos for Day ${day.day} based on user course: ${currentRoadmap.courseName}`);
      
      try {
        // Use universal AI video service
        const { getUniversalVideos } = await import('../services/universalVideoService');
        
        // Get all topics for AI analysis
        const allTopics = currentRoadmap.roadmap.flatMap(d => d.topics?.map(t => t.title) || []);
        
        // Calculate global topic index for this day
        let globalTopicIndex = 0;
        for (let i = 0; i < currentRoadmap.roadmap.length; i++) {
          if (currentRoadmap.roadmap[i].day < day.day) {
            globalTopicIndex += currentRoadmap.roadmap[i].topics?.length || 0;
          } else if (currentRoadmap.roadmap[i].day === day.day) {
            break;
          }
        }
        
        const topicsWithVideos = await Promise.all(
          day.topics.map(async (topic, topicIndex) => {
            const currentGlobalIndex = globalTopicIndex + topicIndex;
            const videos = await getUniversalVideos(
              topic.title, 
              currentRoadmap.courseName, 
              allTopics,
              currentGlobalIndex
            );
            return { ...topic, videos };
          })
        );
        
        const dayWithVideos = {
          ...day,
          topics: topicsWithVideos,
          videos: topicsWithVideos.flatMap(t => t.videos || [])
        };
        
        dispatch({ 
          type: 'UPDATE_DAY_VIDEOS', 
          payload: { dayIndex, day: dayWithVideos } 
        });
        
        console.log(`✅ AI Universal videos loaded for Day ${day.day}`);
      } catch (error) {
        console.error('Failed to load AI videos:', error);
      } finally {
        setLoadingVideos(false);
      }
    }
  };

  const handleTopicComplete = async (dayIndex, topicId) => {
    dispatch({ type: 'COMPLETE_TOPIC', payload: { dayIndex, topicId } });
    await syncXPWithBackend(10);
  };

  const handleDayComplete = async (dayIndex) => {
    dispatch({ type: 'COMPLETE_DAY', payload: dayIndex });
    const nextStreak = (progress.streak || 0) + 1;
    await syncXPWithBackend(50, nextStreak);
  };

  const openQuiz = async (topic) => {
    setSelectedTopic(topic);
    setGeneratingQuiz(true);
    
    try {
      const quiz = await generateQuiz(topic, topic.difficulty);
      dispatch({ type: 'ADD_QUIZ', payload: quiz });
      setShowQuiz(true);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      // Show fallback quiz or error message
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setSelectedTopic(null);
  };

  const handleExportRoadmap = () => {
    if (currentRoadmap) {
      exportRoadmapToPDF(currentRoadmap);
    }
  };

  const handleExportProgress = () => {
    if (currentRoadmap && progress) {
      exportProgressReport(progress, currentRoadmap);
    }
  };

  if (loading) {
    const timeLeft = Math.max(0, 20 - loadingTime);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl">Generating your personalized roadmap...</div>
          <div className="text-blue-200 text-sm mt-2">
            {timeLeft > 0 ? `Auto-loading in ${timeLeft}s` : 'Loading...'}
          </div>
          
          <button
            onClick={async () => {
              console.log('Manual fallback triggered');
              const { courseName, days, skillLevel, studyHours } = location.state || {};
              try {
                dispatch({ type: 'SET_LOADING', payload: true });
                const { generateCompleteRoadmap } = await import('../services/mainService');
                const fallbackRoadmap = await generateCompleteRoadmap(
                  courseName || 'Learning Course',
                  days || 7,
                  skillLevel || 'Intermediate',
                  studyHours || 2
                );
                dispatch({ type: 'SET_ROADMAP', payload: fallbackRoadmap });
              } catch (error) {
                console.error('Manual fallback failed:', error);
                dispatch({ type: 'SET_ERROR', payload: 'Failed to generate roadmap' });
              }
            }}
            className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue with Sample Data
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error: {error}</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentRoadmap) {
    const hasRoadmaps = Array.isArray(roadmaps) && roadmaps.length > 0;

    return (
      <div className="min-h-screen p-4 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {hasRoadmaps && (
                <button
                  onClick={() => navigate('/generate')}
                  className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors bg-white/10 px-4 py-2 rounded-lg"
                >
                  <span>+ New Roadmap</span>
                </button>
              )}
              {user && (
                <span className="text-blue-100 text-sm hidden md:inline border-l border-white/20 pl-4">
                  Welcome, <span className="font-semibold text-white">{user.name}</span>
                </span>
              )}
            </div>
            
            <div className="flex space-x-3 items-center">
              {user && (
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="flex items-center space-x-1.5 bg-red-500/20 text-red-200 border border-red-500/35 px-4 py-2 rounded-lg hover:bg-red-500/35 transition-colors text-sm font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">My Learning Space</h1>
            <div className="flex justify-center space-x-4 mt-2 text-sm text-blue-300">
              <span>XP: {user ? user.totalXP : progress.xpPoints}</span>
              <span>•</span>
              <span>Level: {user ? user.level : progress.level}</span>
              {user && user.currentStreak > 0 && (
                <>
                  <span>•</span>
                  <span>🔥 {user.currentStreak} Day Streak</span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          {/* Left Column: Roadmap list or Empty State */}
          <div className="lg:col-span-2 space-y-6">
            {hasRoadmaps ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roadmaps.map((r) => {
                  if (!r || !Array.isArray(r.roadmap)) return null;
                  const completedTopics = r.roadmap.flatMap(d => d.topics || []).filter(t => t && t.completed).length;
                  const totalTopics = r.roadmap.flatMap(d => d.topics || []).length;
                  const percent = Math.round((completedTopics / totalTopics) * 100) || 0;

                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-effect rounded-2xl p-6 border border-white/10 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-white/20 transition-all duration-300"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-sky-500" />
                      
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-3 truncate group-hover:text-blue-300 transition-colors">
                          {r.courseName}
                        </h2>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          <span className="bg-white/5 border border-white/10 text-xs px-2.5 py-1 rounded-md text-blue-200">
                            ⏱️ {r.totalDays} Days
                          </span>
                          <span className="bg-white/5 border border-white/10 text-xs px-2.5 py-1 rounded-md text-blue-200">
                            ⚡ {r.skillLevel}
                          </span>
                          <span className="bg-white/5 border border-white/10 text-xs px-2.5 py-1 rounded-md text-amber-200">
                            📚 {r.studyHours}h/day
                          </span>
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between text-xs text-blue-200 mb-1.5 font-medium">
                            <span>Course Progress</span>
                            <span>{percent}% ({completedTopics}/{totalTopics} topics)</span>
                          </div>
                          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => dispatch({ type: 'SELECT_ROADMAP', payload: r.id })}
                          className="flex-1 py-3 px-4 rounded-xl font-semibold text-xs text-white text-center
                            bg-gradient-to-br from-blue-600 to-sky-500 tracking-wide
                            hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(59,130,246,0.25)]
                            active:translate-y-0 transition-all duration-200"
                        >
                          Resume Learning →
                        </button>
                        
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the roadmap for "${r.courseName}"?`)) {
                              dispatch({ type: 'DELETE_ROADMAP', payload: r.id });
                            }
                          }}
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                          aria-label="Delete roadmap"
                        >
                          🗑️
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Create New Card */}
                <motion.div
                  onClick={() => navigate('/generate')}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-effect rounded-2xl p-6 border border-dashed border-white/20 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/40 hover:bg-white/[0.02] transition-all duration-300 shadow-md min-h-[220px]"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/60 mb-3 border border-white/10 transition-transform">
                    ➕
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Create New Roadmap</h3>
                  <p className="text-xs text-blue-200 max-w-[200px]">
                    Build another personalized learning path using AI
                  </p>
                </motion.div>
              </div>
            ) : (
              /* Empty State Card */
              <div className="max-w-md mx-auto mt-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-effect rounded-2xl p-8 border border-white/10 text-center shadow-2xl"
                >
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mx-auto mb-6 border border-blue-500/20">
                    <Award className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">No Active Roadmaps</h2>
                  <p className="text-blue-100 text-sm leading-relaxed mb-8">
                    Start your personalized learning path now. Type any topic and our AI will curate a customized roadmap with tutorials and quizzes.
                  </p>
                  <button
                    onClick={() => navigate('/generate')}
                    className="w-full py-3.5 px-6 rounded-xl font-semibold text-[15px] text-white
                      bg-gradient-to-br from-blue-600 to-sky-500 tracking-wide
                      hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.35)]
                      active:translate-y-0 transition-all duration-200"
                  >
                    Create New Roadmap 🚀
                  </button>
                </motion.div>
              </div>
            )}
          </div>

          {/* Right Column: Achievements & Leaderboard */}
          <div className="space-y-6">
            {/* Unlocked Badges Panel */}
            <div className="glass-effect rounded-2xl p-6 border border-white/10 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                🎖️ My Badges
              </h3>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {achievements.map((ach) => (
                    <div key={ach.id} className="group relative flex flex-col items-center justify-center p-2.5 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all text-center">
                      <span className="text-2xl mb-1">{ach.icon}</span>
                      <span className="text-[10px] text-slate-300 font-semibold truncate w-full">{ach.title}</span>
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 w-48 bg-slate-950 border border-white/10 p-2.5 rounded-lg text-left shadow-xl">
                        <p className="text-xs font-bold text-white">{ach.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{ach.description}</p>
                        <p className="text-[9px] text-blue-300 mt-1">Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs leading-relaxed">
                  No badges unlocked yet. Start completing daily topics and quizzes to earn rewards! 🚀
                </div>
              )}
            </div>

            {/* Leaderboard Panel */}
            <div className="glass-effect rounded-2xl p-6 border border-white/10 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                🏆 Global Leaderboard
              </h3>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((u, idx) => {
                    const isSelf = u.id === user?.id;
                    return (
                      <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelf ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-transparent'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 ? 'bg-amber-400 text-black' :
                            idx === 1 ? 'bg-slate-300 text-black' :
                            idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">
                            {u.name} {isSelf && "(You)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-blue-300 font-medium">Lvl {u.level}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-amber-400 font-bold">{u.totalXP} XP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Loading leaderboard ranks...
                </div>
              )}
            </div>
          </div>
        </div>
        <StudyChatbot />
      </div>
    );
  }

  const currentDay = currentRoadmap.roadmap[selectedDay];
  const dayVideos = currentDay.topics.reduce((acc, topic) => {
    if (topic.videos) {
      return [...acc, ...topic.videos];
    }
    return acc;
  }, []);
  const sortedDayVideos = [...dayVideos].sort((a, b) => {
    const aTime = (a && typeof a.startTime === 'number') ? a.startTime : 0;
    const bTime = (b && typeof b.startTime === 'number') ? b.startTime : 0;
    return aTime - bTime;
  });

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => dispatch({ type: 'SET_ROADMAP', payload: null })}
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Roadmaps</span>
            </button>
            <button
              onClick={() => navigate('/generate')}
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors bg-white/10 px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <span>+ New Roadmap</span>
            </button>
            {user && (
              <span className="text-blue-100 text-sm hidden md:inline border-l border-white/20 pl-4">
                Welcome, <span className="font-semibold text-white">{user.name}</span>
              </span>
            )}
          </div>
          
          <div className="flex space-x-3 items-center">
            <button
              onClick={() => setViewMode(viewMode === 'detailed' ? 'simple' : 'detailed')}
              className="flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>{viewMode === 'detailed' ? 'Simple View' : 'Detailed View'}</span>
            </button>
            <button
              onClick={handleExportRoadmap}
              className="flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Roadmap</span>
            </button>
            <button
              onClick={handleExportProgress}
              className="flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Award className="w-4 h-4" />
              <span>Progress Report</span>
            </button>
            {user && (
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="flex items-center space-x-1.5 bg-red-500/20 text-red-200 border border-red-500/35 px-4 py-2 rounded-lg hover:bg-red-500/35 transition-colors text-sm font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">{currentRoadmap.courseName}</h1>
          <p className="text-blue-200">
            {currentRoadmap.totalDays} Day Learning Journey • {progress.completedDays} Days Completed
          </p>
          <div className="flex justify-center space-x-4 mt-2 text-sm text-blue-300">
            <span>Skill Level: {currentRoadmap.skillLevel}</span>
            <span>•</span>
            <span>Study Hours: {currentRoadmap.studyHours}h/day</span>
            <span>•</span>
            <span>XP: {user ? user.totalXP : progress.xpPoints}</span>
            <span>•</span>
            <span>Level: {user ? user.level : progress.level}</span>
            {user && user.currentStreak > 0 && (
              <>
                <span>•</span>
                <span>🔥 {user.currentStreak} Day Streak</span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {viewMode === 'simple' ? (
        <SimpleRoadmapView 
          roadmap={currentRoadmap} 
          onTopicComplete={handleTopicComplete}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Chart & Quick Switch Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <ProgressChart progress={progress} />

            {/* Quick Switch Courses Sidebar Card */}
            {Array.isArray(roadmaps) && roadmaps.length > 1 && (
              <div className="glass-effect rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  📚 My Roadmaps
                </h3>
                <div className="space-y-3">
                  {roadmaps.map((r) => {
                    const isActive = r.id === currentRoadmap.id;
                    const completedTopics = r.roadmap.flatMap(d => d.topics || []).filter(t => t.completed).length;
                    const totalTopics = r.roadmap.flatMap(d => d.topics || []).length;
                    const percent = Math.round((completedTopics / totalTopics) * 100) || 0;

                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          if (!isActive) {
                            dispatch({ type: 'SELECT_ROADMAP', payload: r.id });
                          }
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all duration-200
                          ${isActive
                            ? 'bg-blue-500/20 border-blue-500/40 shadow-[0_2px_12px_rgba(59,130,246,0.15)] cursor-default'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                          }`}
                      >
                        <div className="truncate pr-2">
                          <div className={`font-semibold text-sm truncate ${isActive ? 'text-blue-200' : 'text-slate-200'}`}>
                            {r.courseName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {percent}% Complete ({completedTopics}/{totalTopics})
                          </div>
                        </div>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
          {/* Day Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Select Day
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {currentRoadmap.roadmap.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDaySelect(index)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    selectedDay === index
                      ? 'bg-blue-500 text-white'
                      : day.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <div className="font-semibold">Day {day.day}</div>
                  {day.isRevisionDay && (
                    <div className="text-xs opacity-75">Revision</div>
                  )}
                  {day.completed && <CheckCircle className="w-4 h-4 mx-auto mt-1" />}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Current Day Topics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-effect rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Day {currentDay.day} Topics
              {currentDay.isRevisionDay && (
                <span className="ml-2 px-2 py-1 bg-yellow-500 text-black text-xs rounded-full">
                  Revision Day
                </span>
              )}
            </h2>
            
            <div className="space-y-4">
              {currentDay.topics.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`p-4 rounded-lg border transition-all ${
                    topic.completed
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        {topic.title}
                        {!currentDay.isRevisionDay && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCheatSheet(topic);
                            }}
                            className="p-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 active:scale-95 transition-all"
                            title="Generate AI Cheat Sheet Notes"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </h3>
                      <p className="text-blue-200 text-sm mt-1">{topic.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-blue-300">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {topic.duration}
                        </span>
                        <span className="px-2 py-1 bg-blue-500/30 rounded-full">
                          {topic.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openQuiz(topic)}
                        disabled={generatingQuiz}
                        className={`px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors ${generatingQuiz ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {generatingQuiz ? 'Generating...' : 'Quiz'}
                      </button>
                      {!topic.completed && (
                        <button
                          onClick={() => handleTopicComplete(selectedDay, topic.id)}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {!currentDay.completed && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDayComplete(selectedDay)}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300"
              >
                Complete Day {currentDay.day}
              </motion.button>
            )}
          </motion.div>

          {/* Real-time Video Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-effect rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Play className="w-5 h-5 mr-2" />
              Real-time Video Suggestions for {currentRoadmap.courseName}
              {loadingVideos && (
                <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
            </h2>
            
            {loadingVideos ? (
              <div className="text-center py-8">
                <div className="text-blue-200">Finding best videos for your topics...</div>
              </div>
            ) : sortedDayVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedDayVideos.map((video, index) => (
                  <VideoCard key={video.id} video={video} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-blue-200 mb-4">No videos loaded yet for Day {currentDay.day}</div>
                <button
                  onClick={() => handleDaySelect(selectedDay)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Load Videos for {currentRoadmap.courseName}
                </button>
              </div>
            )}
          </motion.div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && selectedTopic && (
        <QuizModal
          topic={selectedTopic}
          onClose={closeQuiz}
          onComplete={(score) => {
            dispatch({ 
              type: 'UPDATE_QUIZ_SCORE', 
              payload: score 
            });
            syncXPWithBackend(25);
          }}
        />
      )}

      {/* Cheat Sheet Modal */}
      {showCheatSheet && cheatSheetTopic && (
        <CheatSheetModal
          topic={cheatSheetTopic}
          courseName={currentRoadmap?.courseName || ""}
          isOpen={showCheatSheet}
          onClose={closeCheatSheet}
        />
      )}

      <StudyChatbot />
    </div>
  );
};

export default Dashboard;
