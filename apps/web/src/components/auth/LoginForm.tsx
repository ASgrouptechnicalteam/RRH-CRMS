import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sparkles, Bug } from 'lucide-react';
import { EMPLOYEE_CODE_REGEX } from '@rrh-ems/shared';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

interface LoginFormProps {
  onSuccess?: (data: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugDetails, setDebugDetails] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCodeChange = (val: string) => {
    const formatted = val.toUpperCase().trim();
    setEmployeeCode(formatted);

    if (formatted && !EMPLOYEE_CODE_REGEX.test(formatted)) {
      setCodeError('Format must be RRH-XX-000 (e.g. RRH-EX-001)');
    } else {
      setCodeError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setDebugDetails(null);

    if (!employeeCode) {
      setCodeError('Employee ID is required');
      return;
    }

    if (!EMPLOYEE_CODE_REGEX.test(employeeCode)) {
      setCodeError('Invalid format. Expected: RRH-XX-000 (e.g. RRH-EX-001)');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const loginUrl = `${API_BASE_URL}/auth/login`;
      console.log(`[Auth] Attempting login for ${employeeCode}`);

      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code: employeeCode,
          password: password,
        }),
      });

      const responseText = await res.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch (e) {
        // Raw text response fallback
      }

      if (!res.ok) {
        const errorText = responseJson?.error || responseJson?.message || responseText;
        const debugInfo = `HTTP ${res.status} (${res.statusText}) | Response: ${errorText || 'Empty Response'}`;
        setDebugDetails(debugInfo);

        if (res.status === 404) {
          setErrorMessage('Error 404: Auth login route not found on server.');
        } else if (res.status === 401) {
          setErrorMessage(errorText || 'Invalid credentials or inactive account.');
        } else {
          setErrorMessage(`Server Error (${res.status}): ${errorText || 'Authentication failed'}`);
        }
        return;
      }

      console.log('[Auth Success]', responseJson);

      // Authenticate inside AuthContext!
      if (responseJson.accessToken && responseJson.user) {
        login(responseJson.user, responseJson.accessToken);
      }


      if (onSuccess) {
        onSuccess(responseJson);
      }
    } catch (err: any) {
      console.error('[Auth Exception]', err);
      setErrorMessage('Network Error: Cannot connect to API server at http://localhost:3000');
      setDebugDetails(`Exception: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 border border-slate-100 relative">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <img src="/logo.svg" alt="RRH EMS Logo" className="w-14 h-14 rounded-2xl shadow-md mx-auto mb-3 object-contain" />
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Welcome Back</h2>
        <p className="text-xs text-slate-500 mt-1">
          Radha Real Homes & Sonthillu EMS
        </p>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-1.5 animate-fadeIn">
          <div className="flex items-start gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>

          {debugDetails && (
            <div className="mt-2 pt-2 border-t border-red-200/60 font-mono text-[11px] text-red-900 bg-red-100/50 p-2 rounded-xl break-all flex items-start gap-1.5">
              <Bug className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <span className="font-bold uppercase tracking-wider block text-[10px] text-red-700">Diagnostic Logs:</span>
                {debugDetails}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Employee Code Input */}
        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Employee ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={employeeCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="e.g. RRH-EX-001"
              maxLength={10}
              className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                codeError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-teal-600'
              } rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all font-mono tracking-wide placeholder:font-sans placeholder:tracking-normal text-slate-800 font-bold`}
            />
          </div>
          {codeError ? (
            <p className="text-xs text-red-600 mt-1.5 font-medium">{codeError}</p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">
              Format: <span className="font-mono text-slate-600">RRH-&lt;DEPT_CODE&gt;-&lt;3-DIGITS&gt;</span>
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all text-slate-800 font-bold"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In to EMS</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

    </div>
  );
};
