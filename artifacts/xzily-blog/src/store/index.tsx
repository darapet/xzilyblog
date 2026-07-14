import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_USERS, MOCK_CATEGORIES, MOCK_POSTS, MOCK_COMMENTS, User, Category, Post, Comment } from '../data/seed';

type AppState = {
  users: User[];
  categories: Category[];
  posts: Post[];
  comments: Comment[];
  currentUser: User | null;
  likes: Record<string, boolean>; // postId -> isLiked
  bookmarks: Record<string, boolean>; // postId -> isBookmarked
  subscribers: string[]; // emails
  notificationsEnabled: boolean;
};

type StoreContextType = {
  state: AppState;
  login: (email: string) => void;
  logout: () => void;
  createPost: (post: Omit<Post, 'id' | 'createdAt' | 'views' | 'likes' | 'featured' | 'popular'>) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  toggleLike: (postId: string) => void;
  toggleBookmark: (postId: string) => void;
  addComment: (postId: string, content: string, parentId?: string) => void;
  deleteComment: (commentId: string) => void;
  subscribe: (email: string) => void;
  enableNotifications: () => void;
  adminSeedLogin: () => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = 'xzily_app_data_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure dates are valid strings, etc. We just trust the shape for this demo.
        return parsed;
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    }
    
    // Seed initial state
    return {
      users: MOCK_USERS,
      categories: MOCK_CATEGORIES,
      posts: MOCK_POSTS,
      comments: MOCK_COMMENTS,
      currentUser: null,
      likes: {},
      bookmarks: {},
      subscribers: [],
      notificationsEnabled: false
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const login = (email: string) => {
    // Mock login - just find user by email or create a dummy reader
    let user = state.users.find(u => u.email === email);
    if (!user) {
      user = {
        id: `u-${Date.now()}`,
        name: email.split('@')[0],
        email,
        avatar: '',
        role: 'user'
      };
      setState(prev => ({ ...prev, users: [...prev.users, user!], currentUser: user! }));
    } else {
      setState(prev => ({ ...prev, currentUser: user! }));
    }
  };

  const adminSeedLogin = () => {
    const admin = state.users.find(u => u.role === 'admin') || MOCK_USERS[0];
    setState(prev => ({ ...prev, currentUser: admin }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const createPost = (postData: Omit<Post, 'id' | 'createdAt' | 'views' | 'likes' | 'featured' | 'popular'>) => {
    const newPost: Post = {
      ...postData,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      featured: false,
      popular: false
    };
    setState(prev => ({ ...prev, posts: [newPost, ...prev.posts] }));
  };

  const updatePost = (id: string, updates: Partial<Post>) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const deletePost = (id: string) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.filter(p => p.id !== id),
      comments: prev.comments.filter(c => c.postId !== id)
    }));
  };

  const toggleLike = (postId: string) => {
    setState(prev => {
      const isLiked = prev.likes[postId];
      const newLikes = { ...prev.likes, [postId]: !isLiked };
      const newPosts = prev.posts.map(p => {
        if (p.id === postId) {
          return { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 };
        }
        return p;
      });
      return { ...prev, likes: newLikes, posts: newPosts };
    });
  };

  const toggleBookmark = (postId: string) => {
    setState(prev => ({
      ...prev,
      bookmarks: { ...prev.bookmarks, [postId]: !prev.bookmarks[postId] }
    }));
  };

  const addComment = (postId: string, content: string, parentId?: string) => {
    if (!state.currentUser) return;
    
    const newComment: Comment = {
      id: `cmt-${Date.now()}`,
      postId,
      authorId: state.currentUser.id,
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: []
    };

    setState(prev => {
      if (parentId) {
        return {
          ...prev,
          comments: prev.comments.map(c => {
            if (c.id === parentId) {
              return { ...c, replies: [...c.replies, newComment] };
            }
            return c;
          })
        };
      }
      return {
        ...prev,
        comments: [...prev.comments, newComment]
      };
    });
  };

  const deleteComment = (commentId: string) => {
    setState(prev => ({
      ...prev,
      comments: prev.comments.filter(c => c.id !== commentId).map(c => ({
        ...c,
        replies: c.replies.filter(r => r.id !== commentId)
      }))
    }));
  };

  const subscribe = (email: string) => {
    setState(prev => {
      if (prev.subscribers.includes(email)) return prev;
      return { ...prev, subscribers: [...prev.subscribers, email] };
    });
  };

  const enableNotifications = () => {
    setState(prev => ({ ...prev, notificationsEnabled: true }));
  };

  return (
    <StoreContext.Provider value={{
      state,
      login,
      logout,
      createPost,
      updatePost,
      deletePost,
      toggleLike,
      toggleBookmark,
      addComment,
      deleteComment,
      subscribe,
      enableNotifications,
      adminSeedLogin
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}
