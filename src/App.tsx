import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Major US ETFs with historical average annual returns
const ETF_DATA = [
  { symbol: 'SPY', name: 'S&P 500', avgReturn: 10.5, description: 'Tracks the S&P 500 index' },
  { symbol: 'QQQ', name: 'Nasdaq 100', avgReturn: 14.2, description: 'Tech-heavy growth ETF' },
  { symbol: 'VTI', name: 'Total Stock Market', avgReturn: 10.3, description: 'Entire US stock market' },
  { symbol: 'VOO', name: 'Vanguard S&P 500', avgReturn: 10.5, description: 'Low-cost S&P 500 tracker' },
  { symbol: 'IWM', name: 'Russell 2000', avgReturn: 9.1, description: 'Small-cap stocks' },
  { symbol: 'DIA', name: 'Dow Jones', avgReturn: 9.8, description: 'Blue-chip 30 companies' },
];

const PAY_FREQUENCIES = [
  { label: 'Weekly', value: 52 },
  { label: 'Bi-weekly', value: 26 },
  { label: 'Semi-monthly', value: 24 },
  { label: 'Monthly', value: 12 },
];

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function AnimatedNumber({ value, duration = 1 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{formatCurrency(displayValue)}</span>;
}

function calculateCompoundInterest(
  contribution: number,
  frequency: number,
  years: number,
  annualReturn: number
): { total: number; contributions: number; earnings: number; yearlyData: number[] } {
  const periodicRate = annualReturn / 100 / frequency;
  const totalPeriods = frequency * years;
  let balance = 0;
  const yearlyData: number[] = [];

  for (let period = 1; period <= totalPeriods; period++) {
    balance = (balance + contribution) * (1 + periodicRate);
    if (period % frequency === 0) {
      yearlyData.push(balance);
    }
  }

  const contributions = contribution * totalPeriods;
  const earnings = balance - contributions;

  return { total: balance, contributions, earnings, yearlyData };
}

function ETFCard({
  etf,
  isSelected,
  onClick,
  index,
}: {
  etf: typeof ETF_DATA[0];
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={onClick}
      className={`relative p-4 rounded-lg text-left transition-all duration-300 overflow-hidden group ${
        isSelected
          ? 'bg-gradient-to-br from-amber-900/40 to-amber-800/20 border-amber-500/60'
          : 'bg-neutral-900/50 border-neutral-800 hover:border-amber-700/40'
      } border`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isSelected ? 'opacity-100' : ''
        }`}
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(201, 162, 39, 0.08) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-amber-400 font-mono text-lg font-semibold">{etf.symbol}</span>
          <span className="text-emerald-400 text-sm font-mono">+{etf.avgReturn}%</span>
        </div>
        <div className="text-cream text-sm font-medium mb-1">{etf.name}</div>
        <div className="text-neutral-500 text-xs">{etf.description}</div>
      </div>
      {isSelected && (
        <motion.div
          layoutId="etf-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-300"
        />
      )}
    </motion.button>
  );
}

function GrowthChart({ yearlyData, years }: { yearlyData: number[]; years: number }) {
  const maxValue = Math.max(...yearlyData, 1);

  return (
    <div className="flex items-end gap-1 h-48 px-4">
      {yearlyData.map((value, index) => {
        const height = (value / maxValue) * 100;
        return (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ delay: index * 0.03, duration: 0.5, ease: 'easeOut' }}
            className="flex-1 rounded-t relative group cursor-pointer"
            style={{
              background: `linear-gradient(to top, rgba(201, 162, 39, 0.3), rgba(201, 162, 39, 0.8))`,
              minWidth: '8px',
            }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 border border-amber-500/30 px-2 py-1 rounded text-xs text-cream whitespace-nowrap z-10">
              Year {index + 1}: {formatCurrency(value)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [contribution, setContribution] = useState(200);
  const [frequency, setFrequency] = useState(26);
  const [years, setYears] = useState(30);
  const [selectedETF, setSelectedETF] = useState(ETF_DATA[0]);

  const results = useMemo(() => {
    return calculateCompoundInterest(contribution, frequency, years, selectedETF.avgReturn);
  }, [contribution, frequency, years, selectedETF.avgReturn]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-cream relative overflow-hidden">
      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle gradient orbs */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-400 text-sm font-mono tracking-wide">
              COMPOUND WEALTH CALCULATOR
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 tracking-tight">
            Watch Your
            <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              Money Grow
            </span>
          </h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            See the power of consistent investing. Calculate how much wealth you could build by
            saving a portion of every paycheck.
          </p>
        </motion.header>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Contribution Input */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
              <label className="block text-sm text-neutral-400 mb-2 font-mono tracking-wide">
                CONTRIBUTION PER PAYCHECK
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 text-2xl font-display">
                  $
                </span>
                <input
                  type="number"
                  value={contribution}
                  onChange={(e) => setContribution(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl py-4 pl-12 pr-4 text-3xl font-display text-cream focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <input
                type="range"
                min="25"
                max="2000"
                step="25"
                value={contribution}
                onChange={(e) => setContribution(Number(e.target.value))}
                className="w-full mt-4 accent-amber-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>$25</span>
                <span>$2,000</span>
              </div>
            </div>

            {/* Pay Frequency */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
              <label className="block text-sm text-neutral-400 mb-4 font-mono tracking-wide">
                PAY FREQUENCY
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PAY_FREQUENCIES.map((freq) => (
                  <button
                    key={freq.value}
                    onClick={() => setFrequency(freq.value)}
                    className={`py-3 px-4 rounded-lg border transition-all duration-200 ${
                      frequency === freq.value
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                        : 'bg-neutral-800/30 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Years */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
              <label className="block text-sm text-neutral-400 mb-2 font-mono tracking-wide">
                INVESTMENT TIMELINE
              </label>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-display text-cream">{years}</span>
                <span className="text-neutral-500">years</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full mt-4 accent-amber-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>5 years</span>
                <span>50 years</span>
              </div>
            </div>

            {/* ETF Selection */}
            <div>
              <label className="block text-sm text-neutral-400 mb-4 font-mono tracking-wide">
                SELECT BENCHMARK ETF
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ETF_DATA.map((etf, index) => (
                  <ETFCard
                    key={etf.symbol}
                    etf={etf}
                    isSelected={selectedETF.symbol === etf.symbol}
                    onClick={() => setSelectedETF(etf)}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Main Result Card */}
            <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 border border-amber-500/30 rounded-3xl p-8 overflow-hidden">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    'radial-gradient(ellipse at top right, rgba(201, 162, 39, 0.15) 0%, transparent 60%)',
                }}
              />
              <div className="relative z-10">
                <div className="text-sm text-neutral-400 font-mono tracking-wide mb-2">
                  PROJECTED PORTFOLIO VALUE
                </div>
                <div className="text-5xl md:text-6xl font-display font-bold text-cream mb-6">
                  <AnimatedNumber value={results.total} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-neutral-500 font-mono mb-1">TOTAL CONTRIBUTED</div>
                    <div className="text-xl font-display text-neutral-300">
                      {formatCurrency(results.contributions)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 font-mono mb-1">INVESTMENT GAINS</div>
                    <div className="text-xl font-display text-emerald-400">
                      +{formatCurrency(results.earnings)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-800">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-sm">Return multiple</span>
                    <span className="text-amber-400 font-mono text-lg">
                      {(results.total / results.contributions).toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Chart */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-neutral-400 font-mono tracking-wide">
                    GROWTH OVER TIME
                  </div>
                  <div className="text-neutral-500 text-xs mt-1">
                    Based on {selectedETF.avgReturn}% avg annual return ({selectedETF.symbol})
                  </div>
                </div>
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                  <span className="text-amber-400 text-sm font-mono">{selectedETF.symbol}</span>
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedETF.symbol}-${contribution}-${years}-${frequency}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <GrowthChart yearlyData={results.yearlyData} years={years} />
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-between text-xs text-neutral-500 mt-4 px-4">
                <span>Year 1</span>
                <span>Year {years}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: 'Annual Contribution',
                  value: formatCurrency(contribution * frequency),
                },
                {
                  label: 'Monthly Equivalent',
                  value: formatCurrency((contribution * frequency) / 12),
                },
                {
                  label: 'Expected Return',
                  value: `${selectedETF.avgReturn}%`,
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-4"
                >
                  <div className="text-[10px] text-neutral-500 font-mono tracking-wide mb-1">
                    {stat.label.toUpperCase()}
                  </div>
                  <div className="text-lg font-display text-cream">{stat.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-neutral-600 leading-relaxed p-4 bg-neutral-900/20 rounded-lg border border-neutral-800/30">
              <strong className="text-neutral-500">Disclaimer:</strong> Historical returns are not
              indicative of future performance. The average returns shown are based on historical
              data and actual results may vary significantly. This calculator is for educational
              purposes only and should not be considered financial advice.
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-neutral-800/50 text-center">
          <p className="text-neutral-600 text-xs font-mono tracking-wide">
            Requested by <span className="text-neutral-500">@launchcodes1337</span> · Built by{' '}
            <span className="text-neutral-500">@clonkbot</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
