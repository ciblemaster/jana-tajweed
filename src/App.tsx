import { lazy, Suspense } from 'react';
import { levelById } from './garden/levels';
import { currentProfile } from './profiles/store';
import TajweedPage from './tajweed';

const Lesson = lazy(() => import('./garden/Lesson'));
const Profiles = lazy(() => import('./profiles/Profiles'));

// The address decides once what the page is: the profiles, a Rule Garden level, a surah, or the map.
const params = new URLSearchParams(window.location.search);
const level = levelById(params.get('lesson'));
const showProfiles = params.has('profiles') || !currentProfile();

export default function App() {
  if (showProfiles) return <Suspense fallback={<div className="page-wait" />}><Profiles /></Suspense>;
  if (level) return <Suspense fallback={<div className="page-wait" />}><Lesson level={level} /></Suspense>;
  return <TajweedPage />;
}
