import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { TeamList } from './pages/TeamList';
import { TeamDashboard } from './pages/TeamDashboard';
import { TasksPage } from './pages/TasksPage';
import { FilesPage } from './pages/FilesPage';
import { DiscussionsPage } from './pages/DiscussionsPage';
import { ProfileSettings } from './components/settings/ProfileSettings';
import { LoginPage } from './pages/login';
import { SignupPage } from './pages/signup';
import { PeoplePage } from './pages/PeoplePage';
import { DetailsPage } from './pages/DetailsPage';
import { TaskDetailPage } from './pages/TaskDetailPage';


function App() {
  

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<TeamList />} />
        <Route path="/team/:teamId" element={<TeamDashboard />} />
        <Route path="/team/:teamId/tasks" element={<TasksPage />} />
        <Route path="/team/:teamId/files" element={<FilesPage />} />
        <Route path="/team/:teamId/discussions" element={<DiscussionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/settings/profile" element={<ProfileSettings />} />
        <Route path="/team/:teamId/details" element={<DetailsPage />} />
        <Route path="/team/:teamId/people" element={<PeoplePage />} />
        <Route path="/team/:teamId/tasks/:taskId" element={<TaskDetailPage />} />

      </Routes>
    </Router>
  );
}

export default App;