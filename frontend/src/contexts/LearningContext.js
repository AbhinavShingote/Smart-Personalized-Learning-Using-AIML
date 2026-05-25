import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

const LearningContext = createContext();

const initialState = {
  roadmaps: [],
  currentRoadmap: null,
  progress: {
    completedDays: 0,
    completedTopics: 0,
    totalTopics: 0,
    quizScore: 0,
    streak: 0,
    xpPoints: 0,
    level: 1,
    badges: []
  },
  userProfile: {
    skillLevel: 'Intermediate',
    studyHours: 2,
    preferences: {
      learningStyle: 'visual',
      notifications: true
    }
  },
  quizzes: {},
  loading: false,
  error: null
};

const learningReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'LOAD_ALL_DATA': {
      const currentR = action.payload.currentRoadmap || null;
      let loadedRoadmaps = action.payload.roadmaps || [];
      if (currentR && !loadedRoadmaps.some(r => r.id === currentR.id || r.courseName === currentR.courseName)) {
        loadedRoadmaps = [...loadedRoadmaps, currentR];
      }
      return {
        ...state,
        roadmaps: loadedRoadmaps,
        currentRoadmap: null, // Land on the list of roadmaps to choose from
        progress: action.payload.progress || initialState.progress,
        userProfile: action.payload.userProfile || initialState.userProfile
      };
    }

    case 'SET_ROADMAP': {
      if (!action.payload) {
        return { 
          ...state, 
          currentRoadmap: null,
          loading: false,
          error: null
        };
      }

      // Generate a clean unique ID for the roadmap
      const newId = action.payload.id || `roadmap_${Date.now()}`;
      
      // Calculate initial progress based on contents
      const totalT = action.payload.roadmap.flatMap(d => d.topics || []).length;
      
      const newRoadmap = {
        ...action.payload,
        id: newId,
        progress: action.payload.progress || {
          completedDays: 0,
          completedTopics: 0,
          totalTopics: totalT,
          quizScore: 0
        }
      };

      const exists = state.roadmaps.some(r => r.id === newRoadmap.id || r.courseName === newRoadmap.courseName);
      const updatedRoadmaps = exists
        ? state.roadmaps.map(r => (r.id === newRoadmap.id || r.courseName === newRoadmap.courseName) ? newRoadmap : r)
        : [...state.roadmaps, newRoadmap];

      return { 
        ...state, 
        roadmaps: updatedRoadmaps,
        currentRoadmap: newRoadmap,
        progress: { 
          ...state.progress, 
          completedDays: newRoadmap.progress.completedDays || 0,
          completedTopics: newRoadmap.progress.completedTopics || 0,
          totalTopics: totalT,
          quizScore: newRoadmap.progress.quizScore || 0
        },
        loading: false,
        error: null
      };
    }

    case 'SELECT_ROADMAP': {
      const selected = state.roadmaps.find(r => r.id === action.payload);
      if (!selected) return state;
      const totalT = selected.roadmap.flatMap(d => d.topics || []).length;
      return {
        ...state,
        currentRoadmap: selected,
        progress: {
          ...state.progress,
          completedDays: selected.progress?.completedDays || 0,
          completedTopics: selected.progress?.completedTopics || 0,
          totalTopics: totalT,
          quizScore: selected.progress?.quizScore || 0
        }
      };
    }

    case 'DELETE_ROADMAP': {
      const remainingRoadmaps = state.roadmaps.filter(r => r.id !== action.payload);
      return {
        ...state,
        roadmaps: remainingRoadmaps,
        currentRoadmap: state.currentRoadmap && state.currentRoadmap.id === action.payload ? null : state.currentRoadmap
      };
    }
    
    case 'UPDATE_PROGRESS':
      return { ...state, progress: { ...state.progress, ...action.payload } };
    
    case 'COMPLETE_TOPIC': {
      const { dayIndex, topicId } = action.payload;
      if (!state.currentRoadmap) return state;

      const updatedRoadmap = { ...state.currentRoadmap };
      updatedRoadmap.roadmap[dayIndex].topics = updatedRoadmap.roadmap[dayIndex].topics.map(topic =>
        topic.id === topicId ? { ...topic, completed: true } : topic
      );
      
      const newCompletedTopics = (state.progress.completedTopics || 0) + 1;
      const xpGained = 10;

      const updatedRoadmapWithProgress = {
        ...updatedRoadmap,
        progress: {
          ...updatedRoadmap.progress,
          completedTopics: newCompletedTopics
        }
      };
      
      return {
        ...state,
        currentRoadmap: updatedRoadmapWithProgress,
        roadmaps: state.roadmaps.map(r => r.id === state.currentRoadmap.id ? updatedRoadmapWithProgress : r),
        progress: {
          ...state.progress,
          completedTopics: newCompletedTopics,
          xpPoints: state.progress.xpPoints + xpGained
        }
      };
    }
    
    case 'COMPLETE_DAY': {
      const dayIdx = action.payload;
      if (!state.currentRoadmap) return state;

      const updatedRoadmapForDay = { ...state.currentRoadmap };
      updatedRoadmapForDay.roadmap[dayIdx].completed = true;

      const newCompletedDays = (state.progress.completedDays || 0) + 1;
      
      const updatedRoadmapWithProgress = {
        ...updatedRoadmapForDay,
        progress: {
          ...updatedRoadmapForDay.progress,
          completedDays: newCompletedDays
        }
      };
      
      return {
        ...state,
        currentRoadmap: updatedRoadmapWithProgress,
        roadmaps: state.roadmaps.map(r => r.id === state.currentRoadmap.id ? updatedRoadmapWithProgress : r),
        progress: {
          ...state.progress,
          completedDays: newCompletedDays,
          streak: state.progress.streak + 1,
          xpPoints: state.progress.xpPoints + 50
        }
      };
    }
    
    case 'ADD_QUIZ':
      return {
        ...state,
        quizzes: { ...state.quizzes, [action.payload.topicId]: action.payload }
      };
    
    case 'UPDATE_QUIZ_SCORE': {
      if (!state.currentRoadmap) return state;
      const score = Math.max(state.progress.quizScore, action.payload);
      const updatedRoadmapWithProgress = {
        ...state.currentRoadmap,
        progress: {
          ...state.currentRoadmap.progress,
          quizScore: score
        }
      };

      return {
        ...state,
        currentRoadmap: updatedRoadmapWithProgress,
        roadmaps: state.roadmaps.map(r => r.id === state.currentRoadmap.id ? updatedRoadmapWithProgress : r),
        progress: {
          ...state.progress,
          quizScore: score
        }
      };
    }
    
    case 'UPDATE_PROFILE':
      return {
        ...state,
        userProfile: { ...state.userProfile, ...action.payload }
      };
    
    case 'UPDATE_DAY_VIDEOS': {
      const { dayIndex: dayIdx2, day } = action.payload;
      if (!state.currentRoadmap) return state;

      const updatedRoadmapVideos = { ...state.currentRoadmap };
      updatedRoadmapVideos.roadmap[dayIdx2] = day;
      
      return {
        ...state,
        currentRoadmap: updatedRoadmapVideos,
        roadmaps: state.roadmaps.map(r => r.id === state.currentRoadmap.id ? updatedRoadmapVideos : r)
      };
    }
    
    case 'RESET_STATE':
      return {
        ...initialState
      };
    
    default:
      return state;
  }
};

export const LearningProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(learningReducer, initialState);

  // Load data from localStorage when user changes (login/logout/restore)
  useEffect(() => {
    if (user && user.id) {
      const savedData = localStorage.getItem(`learningPlatformData_${user.id}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_ALL_DATA', payload: parsedData });
      } else {
        dispatch({ type: 'RESET_STATE' });
      }
    } else {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [user]);

  // Save data to localStorage whenever state changes for the current user
  useEffect(() => {
    if (user && user.id) {
      const dataToSave = {
        roadmaps: state.roadmaps,
        currentRoadmap: state.currentRoadmap,
        progress: state.progress,
        userProfile: state.userProfile
      };
      localStorage.setItem(`learningPlatformData_${user.id}`, JSON.stringify(dataToSave));
    }
  }, [state.roadmaps, state.currentRoadmap, state.progress, state.userProfile, user]);

  const value = {
    ...state,
    dispatch
  };

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};