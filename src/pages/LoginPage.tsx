import React, { useState } from 'react';
import { AlertCircle, KeyRound, Lock, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function LoginPage() {
  const { authStatus, signIn, claimFirstRunAccess } = useAuth();
  const { language, setLanguage, pick } = useLanguage();

  const isFirstRunSetup = Boolean(
    authStatus && !authStatus.envConfigured && !authStatus.claimed
  );

  const [employeeId, setEmployeeId] = useState(
    authStatus?.claimedEmployeeId || 'KA-GOV-4082'
  );
  const [officerName, setOfficerName] = useState('Siddharth Rao');
  const [designation, setDesignation] = useState('Revenue / Case Officer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isFirstRunSetup && password !== confirmPassword) {
      setError(
        pick('Passcodes do not match.', 'ಪಾಸ್‌ಕೋಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.')
      );
      return;
    }

    setSubmitting(true);
    try {
      if (isFirstRunSetup) {
        await claimFirstRunAccess({
          employeeId,
          officerName,
          designation,
          password,
        });
      } else {
        await signIn({
          employeeId,
          password,
          officerName: authStatus?.envConfigured ? officerName : undefined,
          designation: authStatus?.envConfigured ? designation : undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F5F8] text-slate-900">
      {/* Subtle Karnataka State Top Hairline */}
      <div className="h-1 w-full flex shrink-0">
        <div className="flex-1 bg-[#EAB308]" />
        <div className="flex-1 bg-[#DC2626]" />
      </div>

      {/* Top Corner Official Portal Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/karnataka-emblem.svg"
            alt="Government of Karnataka Emblem"
            className="w-10 h-10 shrink-0"
          />
          <div className="leading-tight">
            <div className="text-[11px] font-semibold text-amber-800 tracking-wide">
              {pick('GOVERNMENT OF KARNATAKA', 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ')}
            </div>
            <div className="font-display font-bold text-base text-[#123254] tracking-tight">
              {pick('LEKHASETU · e-Governance Portal', 'ಲೇಖಸೇತು · ಇ-ಆಡಳಿತ ಪೋರ್ಟಲ್')}
            </div>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              language === 'en'
                ? 'bg-[#123254] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('kn')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              language === 'kn'
                ? 'bg-[#123254] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>
      </header>

      {/* Main Authentication Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-[#123254] px-6 py-5 text-white flex items-center gap-3.5">
            <img
              src="/karnataka-emblem.svg"
              alt="Karnataka Seal"
              className="w-11 h-11 shrink-0"
            />
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight">
                {isFirstRunSetup
                  ? pick('Initialize Officer Access', 'ಅಧಿಕಾರಿ ಪ್ರವೇಶವನ್ನು ಪ್ರಾರಂಭಿಸಿ')
                  : pick('Department Officer Sign In', 'ಇಲಾಖಾ ಅಧಿಕಾರಿ ಲಾಗಿನ್')}
              </h1>
              <p className="text-xs text-slate-200 mt-0.5">
                {pick(
                  'Authorized access to handwritten document digitization',
                  'ಕೈಬರಹ ದಾಖಲೆ ಡಿಜಿಟಲೀಕರಣ ಪೋರ್ಟಲ್ ಪ್ರವೇಶ'
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {isFirstRunSetup && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  {pick(
                    'First-time setup: Create your officer passcode to activate local department access.',
                    'ಮೊದಲ ಬಾರಿಗೆ ಸೆಟಪ್: ಸ್ಥಳೀಯ ಇಲಾಖೆ ಪ್ರವೇಶವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು ನಿಮ್ಮ ಅಧಿಕಾರಿ ಪಾಸ್‌ಕೋಡ್ ರಚಿಸಿ.'
                  )}
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {pick('Government Employee ID', 'ಸರ್ಕಾರಿ ನೌಕರರ ಐಡಿ')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="KA-GOV-4082"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#123254]"
                />
              </div>
            </div>

            {(isFirstRunSetup || authStatus?.envConfigured) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {pick('Officer Name', 'ಅಧಿಕಾರಿಯ ಹೆಸರು')}
                  </label>
                  <input
                    type="text"
                    required={isFirstRunSetup}
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#123254]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {pick('Designation', 'ಹುದ್ದೆ')}
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#123254]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isFirstRunSetup
                  ? pick('Create Officer Passcode (min 6 chars)', 'ಅಧಿಕಾರಿ ಪಾಸ್‌ಕೋಡ್ ರಚಿಸಿ (ಕನಿಷ್ಠ 6 ಅಕ್ಷರ)')
                  : pick('Officer Passcode', 'ಅಧಿಕಾರಿ ಪಾಸ್‌ಕೋಡ್')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={isFirstRunSetup ? 6 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#123254]"
                />
              </div>
            </div>

            {isFirstRunSetup && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {pick('Confirm Passcode', 'ಪಾಸ್‌ಕೋಡ್ ದೃಢೀಕರಿಸಿ')}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#123254]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#123254] hover:bg-[#0d2642] disabled:bg-slate-400 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {submitting
                ? pick('Verifying...', 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...')
                : isFirstRunSetup
                  ? pick('Activate & Enter Portal', 'ಸಕ್ರಿಯಗೊಳಿಸಿ ಮತ್ತು ಪ್ರವೇಶಿಸಿ')
                  : pick('Sign In to LEKHASETU', 'ಲೇಖಸೇತುಗೆ ಲಾಗಿನ್ ಮಾಡಿ')}
            </button>
          </form>

          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{pick('Karnataka Digital Document Registry', 'ಕರ್ನಾಟಕ ಡಿಜಿಟಲ್ ದಾಖಲೆ ನೋಂದಣಿ')}</span>
            <span>{pick('Offline-Ready', 'ಆಫ್‌ಲೈನ್ ಸಿದ್ಧ')}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
