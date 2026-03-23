/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../store';
import { Trophy, BookOpen, BarChart3, LogOut } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useStore();

  const lessons = [
    { id: 'nouns', title: 'Nouns', description: 'The Naming Words', icon: '📝' },
    { id: 'verbs', title: 'Verbs', description: 'The Action Words', icon: '⚡' },
    { id: 'tenses', title: 'Tenses', description: 'The Time Travelers', icon: '⏰' },
    { id: 'articles', title: 'Articles', description: 'The Little Helpers', icon: '🎯' },
    { id: 'prepositions', title: 'Prepositions', description: 'The Position Words', icon: '📍' },
    { id: 'adjectives', title: 'Adjectives', description: 'The Describing Words', icon: '✨' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome back, {user?.username}!</h1>
            <p className="text-gray-600">Class: {user?.class}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Total Lessons</p>
                <p className="text-3xl font-bold text-gray-800">{lessons.length}</p>
              </div>
              <BookOpen size={40} className="text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Your Points</p>
                <p className="text-3xl font-bold text-gray-800">{useStore.getState().score}</p>
              </div>
              <Trophy size={40} className="text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Progress</p>
                <p className="text-3xl font-bold text-gray-800">0%</p>
              </div>
              <BarChart3 size={40} className="text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Grammar Lessons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-not-allowed opacity-50"
              >
                <div className="text-4xl mb-3">{lesson.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{lesson.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{lesson.description}</p>
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-gray-700">
            <span className="font-semibold">Note:</span> Navigate to lessons through the main app menu. This dashboard is a preview of your learning journey.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
