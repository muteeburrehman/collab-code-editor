'use client'

import { useState, useEffect } from 'react';

export default function CollaboratorsList({ collaborators = [], currentUserId }) {
  const [showAllCollaborators, setShowAllCollaborators] = useState(false);

  if (!collaborators.length) return null;

  // Filter out current user and limit display to 4 collaborators unless expanded
  const otherCollaborators = collaborators.filter(c => c.id !== currentUserId);
  const displayCollaborators = showAllCollaborators ? otherCollaborators : otherCollaborators.slice(0, 4);
  const remainingCount = otherCollaborators.length - displayCollaborators.length;

  // Generate consistent colors based on username
  const getUserColor = (username) => {
    const colors = [
      'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
      'bg-rose-500', 'bg-sky-500', 'bg-violet-500',
      'bg-pink-500', 'bg-teal-500', 'bg-orange-500'
    ];

    // Simple hash function to pick a consistent color
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="absolute top-14 right-4 flex flex-col items-end z-10">
      <div className="bg-white rounded-lg shadow-md p-2 min-w-48">
        <div className="text-sm font-medium text-gray-700 mb-2 border-b pb-1">Active collaborators</div>
        <div className="flex flex-col gap-2">
          {displayCollaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center">
              <div className={`h-7 w-7 rounded-full ${getUserColor(collaborator.username)} flex items-center justify-center text-white text-xs font-medium mr-2`}>
                {collaborator.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-800 truncate">{collaborator.username}</span>
            </div>
          ))}

          {remainingCount > 0 && (
            <button
              onClick={() => setShowAllCollaborators(true)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 text-left"
            >
              Show {remainingCount} more {remainingCount === 1 ? 'collaborator' : 'collaborators'}
            </button>
          )}

          {showAllCollaborators && otherCollaborators.length > 4 && (
            <button
              onClick={() => setShowAllCollaborators(false)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 text-left"
            >
              Show less
            </button>
          )}
        </div>
      </div>

      {/* Collapsed view that's always visible */}
      <div className="flex -space-x-2 mt-2 cursor-pointer" onClick={() => setShowAllCollaborators(!showAllCollaborators)}>
        {otherCollaborators.slice(0, 3).map((collaborator) => (
          <div
            key={collaborator.id}
            className={`h-8 w-8 rounded-full ${getUserColor(collaborator.username)} flex items-center justify-center text-white text-sm font-medium border-2 border-white`}
            title={collaborator.username}
          >
            {collaborator.username.charAt(0).toUpperCase()}
          </div>
        ))}

        {otherCollaborators.length > 3 && (
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-medium border-2 border-white">
            +{otherCollaborators.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}