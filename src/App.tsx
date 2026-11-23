import { lazy, Suspense } from 'react';
import { levelById } from './garden/levels';
import { currentProfile } from './profiles/store';
import TajweedPage from './tajweed';

const Lesson = lazy(() => import('./garden/Lesson'));
const Letters = lazy(() => import('./garden/Letters'));
const Profiles = lazy(() => import('./profiles/Profiles'));
const Mission = lazy(() => import('./garden/Mission'));
const Parents = lazy(() => import('./parents/Parents'));

// The address decides once what the page is: the grown-ups' page, the profiles, today's mission, a Rule Garden level, a surah, or the map.
const params = new URLSearchParams(window.location.search);
const level = levelById(params.get('lesson'));
const showParents = params.has('parents');
const showMission = params.has('mission');
const showProfiles = params.has('profiles') || !currentProfile();

export default function App() {
  if (showParents) return <Suspense fallback={<div className="page-wait" />}><Parents /></Suspense>;
  if (showProfiles) return <Suspense fallback={<div className="page-wait" />}><Profiles /></Suspense>;
  if (showMission) return <Suspense fallback={<div className="page-wait" />}><Mission /></Suspense>;
  if (level?.kind === 'letters') return <Suspense fallback={<div className="page-wait" />}><Letters level={level} /></Suspense>;
  if (level) return <Suspense fallback={<div className="page-wait" />}><Lesson level={level} /></Suspense>;
  return <TajweedPage />;
}
