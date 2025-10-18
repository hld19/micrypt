import { useEffect, useState, useRef } from 'react';
import { StartEntropyCollection, AddEntropyEvent, GetEntropyProgress, IsEntropyComplete } from '../../wailsjs/go/main/App';
import { ShieldIcon } from './Icons';

interface EntropyCollectorProps {
  onComplete: () => void;
}

export default function EntropyCollector({ onComplete }: EntropyCollectorProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<number>();

  useEffect(() => {
    StartEntropyCollection();

    const handleMouseMove = (e: MouseEvent) => {
      const timestamp = Date.now();
      AddEntropyEvent(e.clientX, e.clientY, timestamp);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const code = typeof e.keyCode === 'number' ? e.keyCode : 0;
      const timestamp = Date.now();
      AddEntropyEvent(-Math.abs(code) - 1, 0, timestamp);
    };

    const checkProgress = async () => {
      const prog = await GetEntropyProgress();
      setProgress(prog);

      const complete = await IsEntropyComplete();
      if (complete && !isComplete) {
        setIsComplete(true);
        setTimeout(() => {
          setShowSuccess(true);
        }, 500);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    checkIntervalRef.current = window.setInterval(checkProgress, 100);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [onComplete, isComplete]);

  const progressPercent = Math.floor(progress * 100);
  const eventsNeeded = 500;
  const eventsCollected = Math.floor(progress * eventsNeeded);

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-neuro-bg-light dark:bg-neuro-bg-dark flex items-center justify-center z-50">
        <div className="w-full max-w-xl mx-8">
          <div className="neuro-card rounded-neuro-lg p-12 space-y-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full neuro-card flex items-center justify-center">
                  <ShieldIcon size={56} className="text-green-500" />
                </div>
              </div>
              <div>
                <h2 className="text-5xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-3 tracking-tight">
                  Entropy Successful
                </h2>
                <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark text-lg font-medium">
                  Sufficient randomness collected for secure vault creation
                </p>
              </div>
            </div>

            <div className="neuro-inset rounded-neuro p-6">
              <div className="flex items-center justify-center gap-3 text-sm">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark">
                  {eventsNeeded} entropy events collected
                </span>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="neuro-card hover:neuro-card w-full px-8 py-5 text-lg font-bold rounded-neuro text-neuro-text-primary-light dark:text-neuro-text-primary-dark"
            >
              Choose Vault Location
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-neuro-bg-light dark:bg-neuro-bg-dark flex items-center justify-center z-50"
    >
      <div className="w-full max-w-2xl mx-8">
        <div className="neuro-card rounded-neuro-lg p-12 space-y-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full neuro-card flex items-center justify-center">
                <ShieldIcon size={56} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-3 tracking-tight">
                Collecting Entropy
              </h2>
              <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark text-lg font-medium">
                Move your mouse and type to generate random data
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark">
                  Progress
                </span>
                <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark">
                  {eventsCollected} / {eventsNeeded} events
                </span>
              </div>
              <div className="h-6 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-inset overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-300 to-white dark:from-gray-700 dark:to-gray-500 transition-all duration-200 ease-out flex items-center justify-end pr-3"
                  style={{ width: `${progressPercent}%` }}
                >
                  {progressPercent > 10 && (
                    <span className="text-xs font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark">
                      {progressPercent}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="neuro-inset rounded-neuro p-6 space-y-3">
              <h3 className="font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark text-lg mb-3">
                How to generate entropy:
              </h3>
              <ul className="space-y-2 text-sm text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark">
                <li className="flex items-start gap-3">
                  <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold flex-shrink-0">•</span>
                  <span className="font-medium">Move your mouse randomly around this window</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold flex-shrink-0">•</span>
                  <span className="font-medium">Type random keys on your keyboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold flex-shrink-0">•</span>
                  <span className="font-medium">Continue until the progress bar reaches 100%</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-500' : 'bg-neuro-text-muted-light dark:bg-neuro-text-muted-dark'}`}></div>
              <span className="font-bold text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark">
                {isComplete ? 'Collection complete!' : 'Collecting random data...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
