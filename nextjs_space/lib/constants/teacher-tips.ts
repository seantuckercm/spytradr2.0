
export type TeacherTipTrigger =
  | 'first_watchlist_created'
  | 'first_item_added'
  | 'first_analysis_run'
  | 'first_signal_generated'
  | 'signal_confidence_explained'
  | 'first_agent_created'
  | 'agent_running'
  | 'scanner_used'
  | 'backtest_created'
  | 'performance_viewed'
  | 'alert_configured'
  | 'high_confidence_signal'
  | 'low_confidence_warning'
  | 'multiple_strategies'
  | 'risk_management'
  | 'stop_loss_importance'
  | 'copilot_intro'
  | 'watchlist_strategies';

export interface TeacherTip {
  id: TeacherTipTrigger;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  category: 'getting-started' | 'analysis' | 'automation' | 'risk' | 'advanced';
  showOnce?: boolean; // Only show this tip once
}

export const TEACHER_TIPS: Record<TeacherTipTrigger, TeacherTip> = {
  first_watchlist_created: {
    id: 'first_watchlist_created',
    title: '🎉 Great start!',
    message: 'Watchlists help you organize and monitor multiple trading pairs. You can apply different strategies and timeframes to each pair for comprehensive analysis.',
    priority: 'high',
    category: 'getting-started',
    showOnce: true,
  },
  
  first_item_added: {
    id: 'first_item_added',
    title: '📊 Pro tip: Multiple Timeframes',
    message: 'Selecting multiple timeframes (like 1h + 4h + 1d) helps confirm signals across different perspectives. A signal that appears on multiple timeframes is typically stronger!',
    priority: 'high',
    category: 'analysis',
    showOnce: true,
  },

  first_analysis_run: {
    id: 'first_analysis_run',
    title: '🔍 Understanding Analysis',
    message: 'The analysis engine uses technical indicators (RSI, MACD, Bollinger Bands) to identify potential trading opportunities. Each signal includes entry, stop loss, and take profit suggestions.',
    priority: 'high',
    category: 'analysis',
    showOnce: true,
  },

  first_signal_generated: {
    id: 'first_signal_generated',
    title: '✨ Signal Generated!',
    message: 'Signals show potential trading opportunities with confidence scores. Higher confidence (>70%) means stronger indicator alignment. Always verify signals with your own research!',
    priority: 'high',
    category: 'analysis',
    showOnce: true,
  },

  signal_confidence_explained: {
    id: 'signal_confidence_explained',
    title: '💡 Confidence Scores',
    message: 'Confidence represents how strongly multiple indicators agree. 80%+ = Strong signal, 60-79% = Moderate, <60% = Weak. Consider combining with other analysis methods.',
    priority: 'medium',
    category: 'analysis',
    showOnce: true,
  },

  first_agent_created: {
    id: 'first_agent_created',
    title: '🤖 Automation Power!',
    message: 'Scheduled agents automatically scan your selected pairs at regular intervals. They generate signals even when you\'re away, helping you never miss opportunities.',
    priority: 'high',
    category: 'automation',
    showOnce: true,
  },

  agent_running: {
    id: 'agent_running',
    title: '⚙️ Agent Best Practices',
    message: 'Set realistic intervals (15-60 min recommended) and monitor min confidence thresholds. Too frequent runs may generate noise; too infrequent might miss opportunities.',
    priority: 'medium',
    category: 'automation',
    showOnce: true,
  },

  scanner_used: {
    id: 'scanner_used',
    title: '🔎 Market Scanner',
    message: 'The scanner analyzes ALL available pairs simultaneously. Use filters to narrow down by direction, risk, or strategy. Great for discovering new opportunities!',
    priority: 'medium',
    category: 'getting-started',
    showOnce: true,
  },

  backtest_created: {
    id: 'backtest_created',
    title: '📈 Backtesting Explained',
    message: 'Backtesting simulates your strategy on historical data. A good win rate (>50%) and positive profit factor (>1.5) indicate strategy viability. Remember: past performance doesn\'t guarantee future results.',
    priority: 'high',
    category: 'advanced',
    showOnce: true,
  },

  performance_viewed: {
    id: 'performance_viewed',
    title: '📊 Track Your Progress',
    message: 'Performance analytics help you identify which strategies work best for you. Review your trade journal regularly to learn from both wins and losses.',
    priority: 'medium',
    category: 'advanced',
    showOnce: true,
  },

  alert_configured: {
    id: 'alert_configured',
    title: '🔔 Stay Informed',
    message: 'Alerts notify you instantly when new signals match your criteria. Configure quiet hours and max alerts per hour to avoid notification fatigue.',
    priority: 'medium',
    category: 'getting-started',
    showOnce: true,
  },

  high_confidence_signal: {
    id: 'high_confidence_signal',
    title: '🎯 High Confidence Signal!',
    message: 'This signal shows strong indicator alignment (80%+). While promising, always use proper position sizing and risk management. No signal is guaranteed!',
    priority: 'high',
    category: 'risk',
    showOnce: false, // Show every time for emphasis
  },

  low_confidence_warning: {
    id: 'low_confidence_warning',
    title: '⚠️ Lower Confidence',
    message: 'This signal has weaker confidence (<60%). Consider waiting for stronger confirmation or reducing position size if you decide to act on it.',
    priority: 'medium',
    category: 'risk',
    showOnce: false,
  },

  multiple_strategies: {
    id: 'multiple_strategies',
    title: '🎲 Strategy Diversity',
    message: 'Using multiple strategies (momentum, trend, mean reversion) helps capture different market conditions. Some work better in trending markets, others in ranging markets.',
    priority: 'medium',
    category: 'analysis',
    showOnce: true,
  },

  risk_management: {
    id: 'risk_management',
    title: '🛡️ Risk Management is Key',
    message: 'Never risk more than 1-2% of your capital per trade. Always use stop losses. The goal is to stay in the game long enough to be consistently profitable.',
    priority: 'high',
    category: 'risk',
    showOnce: false, // Important reminder
  },

  stop_loss_importance: {
    id: 'stop_loss_importance',
    title: '🚨 Stop Loss Protection',
    message: 'Stop losses protect your capital by automatically exiting losing trades. The suggested stop loss is based on technical levels, but adjust based on your risk tolerance.',
    priority: 'high',
    category: 'risk',
    showOnce: true,
  },

  copilot_intro: {
    id: 'copilot_intro',
    title: '🤖 AI Copilot',
    message: 'Ask the AI Copilot to analyze watchlists, create agents, or explain strategies. It can execute platform actions directly - try "analyze my watchlist" or "create a momentum agent for BTC/USD".',
    priority: 'high',
    category: 'getting-started',
    showOnce: true,
  },

  watchlist_strategies: {
    id: 'watchlist_strategies',
    title: '📋 Strategy Selection',
    message: 'Each pair can use multiple strategies. Momentum works in strong trends, Mean Reversion in ranging markets, and Bollinger Breakout for volatility plays. Experiment to find what works!',
    priority: 'medium',
    category: 'analysis',
    showOnce: true,
  },
};

// Helper to get tips by category
export function getTipsByCategory(category: TeacherTip['category']): TeacherTip[] {
  return Object.values(TEACHER_TIPS).filter(tip => tip.category === category);
}

// Helper to get tips by priority
export function getTipsByPriority(priority: TeacherTip['priority']): TeacherTip[] {
  return Object.values(TEACHER_TIPS).filter(tip => tip.priority === priority);
}
