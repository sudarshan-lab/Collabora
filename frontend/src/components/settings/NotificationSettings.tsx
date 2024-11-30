import React, { useState } from 'react';

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    email: {
      comments: true,
      mentions: true,
      updates: false,
    },
    push: {
      comments: false,
      mentions: true,
      updates: true,
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose how and when you want to be notified.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
          <div className="mt-4 space-y-4">
            {Object.entries(settings.email).map(([key, value]) => (
              <div key={key} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={`email-${key}`}
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, [key]: e.target.checked }
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor={`email-${key}`} className="text-sm font-medium text-gray-700">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive email notifications when someone {key} on your posts.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
          <div className="mt-4 space-y-4">
            {Object.entries(settings.push).map(([key, value]) => (
              <div key={key} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={`push-${key}`}
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        push: { ...settings.push, [key]: e.target.checked }
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor={`push-${key}`} className="text-sm font-medium text-gray-700">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive push notifications when someone {key} on your posts.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}