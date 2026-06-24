import { useState, useMemo } from 'react';
import { getProjectRows } from './data/dataAccess';
import { KpiHeader } from './components/KpiHeader';
import { MainTable } from './components/MainTable';
import { AtRiskPanel } from './components/AtRiskPanel';
import { FundingView } from './components/FundingView';
import { SpecTab } from './components/SpecTab';

type Tab = 'pipeline' | 'atRisk' | 'funding' | 'spec';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'pipeline', label: 'Loans Pipeline', icon: '📋' },
  { id: 'atRisk', label: 'Install Risks', icon: '⚠️' },
  { id: 'funding', label: 'Funding & Recon', icon: '💰' },
  { id: 'spec', label: 'Process & Spec', icon: '📄' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('pipeline');
  const rows = useMemo(() => getProjectRows(), []);
  const atRiskCount = rows.filter((r) => r.isAtRisk).length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">J</div>
            <div>
              <span className="font-bold text-gray-900 text-base">Jetson</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-gray-500 text-sm">Loans Pipeline Tracker</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">Mock Data</span>
            <span>CS / PC View</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-screen-2xl mx-auto px-6 flex gap-1">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            const badge = t.id === 'atRisk' && atRiskCount > 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
                {badge && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold">
                    {atRiskCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full">
        {tab !== 'spec' && <KpiHeader rows={rows} />}

        <div className="bg-white shadow-sm min-h-96">
          {tab === 'pipeline' && <MainTable rows={rows} />}
          {tab === 'atRisk' && <AtRiskPanel rows={rows} />}
          {tab === 'funding' && <FundingView rows={rows} />}
          {tab === 'spec' && <SpecTab />}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        Jetson Loans Pipeline Tracker · Prototype · Mock data only · Not connected to HubSpot
      </footer>
    </div>
  );
}
