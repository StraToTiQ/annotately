import React, { useState } from 'react';
import { authService } from '../services/api';
import { motion } from 'motion/react';

export const Login = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await authService.register(username, email, password);
        await authService.login(username, password);
      } else {
        await authService.login(username, password);
      }
      onLoginSuccess();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { detail?: string } } };
      if (errorData.response?.data?.detail) {
        setError(errorData.response.data.detail);
      } else {
        setError(isRegistering ? 'Registration failed' : 'Invalid username or password');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex flex-col justify-center h-full my-auto"
    >
      <h2 className="text-xl font-bold mb-6 text-[#FACC15] tracking-tight">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
      {error && <p className="text-red-400 text-xs mb-4 bg-red-400/10 p-2 rounded-lg">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Username</label>
          <input 
            type="text" 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-[#FACC15]/50 text-zinc-100 placeholder:text-zinc-600 box-border" 
            placeholder="johndoe"
            value={username} 
            onChange={v => setUsername(v.target.value)} 
            required
          />
        </div>
        
        {isRegistering && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-[#FACC15]/50 text-zinc-100 placeholder:text-zinc-600 box-border" 
              placeholder="john@example.com"
              value={email} 
              onChange={v => setEmail(v.target.value)} 
              required
            />
          </div>
        )}
        
        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Password</label>
          <input 
            type="password" 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-[#FACC15]/50 text-zinc-100 placeholder:text-zinc-600 box-border" 
            placeholder="••••••••"
            value={password} 
            onChange={v => setPassword(v.target.value)} 
            required
          />
        </div>
        
        <button 
          className="w-full bg-[#FACC15] text-black p-3 mt-4 rounded-xl text-sm font-bold hover:bg-[#EAB308] transition-colors box-border" 
          type="submit"
        >
          {isRegistering ? 'Sign Up' : 'Secure Login'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button 
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
          }}
        >
          {isRegistering ? 'Already have an account? Login here' : "Don&apos;t have an account? Register"}
        </button>
      </div>
    </motion.div>
  );
};
