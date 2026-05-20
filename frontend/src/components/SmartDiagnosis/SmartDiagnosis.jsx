import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Wrench, Sparkles, PlusCircle, ArrowRight, ArrowLeft, CheckCircle2, ChevronRight, HelpCircle, Zap } from 'lucide-react';
import { diagnosisDataBase } from './rules';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const iconMap = {
  Hammer: <Hammer className="w-8 h-8" />,
  Wrench: <Wrench className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  PlusCircle: <PlusCircle className="w-8 h-8" />
};

const SmartDiagnosis = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleServiceSelect = (serviceId) => {
    setSelectedService(diagnosisDataBase[serviceId]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setDiagnosisResult(null);
  };

  const handleAnswer = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    const questions = selectedService.questions;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate diagnosis
      const result = selectedService.evaluate(newAnswers);
      setDiagnosisResult(result);
    }
  };

  const handleBack = () => {
    if (diagnosisResult) {
      setDiagnosisResult(null);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setSelectedService(null);
    }
  };

  const resetDiagnosis = () => {
    setSelectedService(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setDiagnosisResult(null);
  };

  const handleBookNow = () => {
    navigate('/book');
  };

  // Variants for framer-motion animations
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-[#1A2235] text-white rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-white/10 relative overflow-hidden min-h-[400px]">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      
      <div className="mb-8 mt-2 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-400" />
            AI Diagnosis
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Answer a few questions to identify the issue and estimate costs.
          </p>
        </div>
        
        {selectedService && (
          <button 
            onClick={resetDiagnosis}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Start Over
          </button>
        )}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {!selectedService && (
            <motion.div
              key="services"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
            >
              <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
                {Object.values(diagnosisDataBase).map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => handleServiceSelect(srv.id)}
                    className="flex-shrink-0 w-[240px] sm:w-auto snap-center flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl hover:bg-white/10 hover:shadow-lg transition-all border border-white/5 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="bg-[#0B0F19] p-4 rounded-full shadow-inner text-blue-400 group-hover:scale-110 transition-transform mb-4 border border-white/5 relative z-10">
                      {iconMap[srv.icon] || <HelpCircle className="w-8 h-8" />}
                    </div>
                    <span className="font-semibold text-white relative z-10">{srv.title}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {selectedService && !diagnosisResult && (
            <motion.div
              key="questions"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
            >
              <div className="mb-6 flex items-center justify-between">
                <button 
                  onClick={handleBack}
                  className="flex items-center text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </button>
                <div className="text-sm font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  Step {currentQuestionIndex + 1} of {selectedService.questions.length}
                </div>
              </div>

              <div className="bg-[#0B0F19]/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-xl font-medium text-white mb-6">
                  {selectedService.questions[currentQuestionIndex].question}
                </h3>
                
                <div className="space-y-3">
                  {selectedService.questions[currentQuestionIndex].options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(selectedService.questions[currentQuestionIndex].id, opt.value)}
                      className="w-full text-left px-5 py-4 rounded-xl border border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-white/10 hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <span className="text-slate-200 font-medium group-hover:text-blue-300 transition-colors">
                        {opt.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {diagnosisResult && (
            <motion.div
              key="results"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
            >
              <div className="mb-4">
                <button 
                  onClick={handleBack}
                  className="flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </button>
              </div>

              <div className="bg-[#0B0F19]/80 p-6 rounded-2xl border border-white/5 shadow-inner">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-400 shrink-0 border border-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                      Diagnosis Complete
                    </h3>
                    <p className="text-2xl font-bold text-white leading-tight">
                      {diagnosisResult.problem}
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-purple-500/20 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden text-center sm:text-left">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-[100px] -z-0 blur-2xl" />
                  <div className="relative z-10 w-full">
                    <p className="text-sm text-slate-400 font-medium mb-2">Estimated Cost Range</p>
                    <p className="border border-purple-500/30 text-purple-300 bg-purple-500/10 inline-block px-4 py-2 rounded-lg font-bold text-2xl shadow-inner">
                      {diagnosisResult.priceRange}
                    </p>
                    <p className="text-xs text-slate-500 mt-3">*Final price depends on parts & exact checkup.</p>
                  </div>
                </div>

                <div className="bg-blue-500/10 p-5 rounded-xl mb-8 border border-blue-500/20">
                  <p className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Recommendation
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {diagnosisResult.recommendation}
                  </p>
                </div>

                <button 
                  onClick={handleBookNow}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-600/40 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Book a Technician Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SmartDiagnosis;
