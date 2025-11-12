
// Platform Tool Definitions for AI Agent

export const PLATFORM_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'getUserProfile',
      description: 'Get the current user profile information including tier, limits, and usage stats',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getWatchlists',
      description: 'Get all watchlists for the current user with their items and configurations',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createWatchlist',
      description: 'Create a new watchlist with specified trading pairs',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the watchlist',
          },
          description: {
            type: 'string',
            description: 'Description of the watchlist purpose',
          },
          defaultConfidenceThreshold: {
            type: 'number',
            description: 'Default confidence threshold (0-100)',
            minimum: 0,
            maximum: 100,
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addWatchlistItem',
      description: 'Add a trading pair to a watchlist with specific strategies and timeframes',
      parameters: {
        type: 'object',
        properties: {
          watchlistId: {
            type: 'string',
            description: 'ID of the watchlist to add the item to',
          },
          inputSymbol: {
            type: 'string',
            description: 'Trading pair symbol (e.g., BTC/USD, XBTUSD, XXBTZUSD)',
          },
          timeframes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
            },
            description: 'Timeframes to analyze',
          },
          strategies: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'momentum',
                'trend',
                'reversal',
                'breakout',
                'scalping',
                'swing',
              ],
            },
            description: 'Trading strategies to apply',
          },
          confidenceThreshold: {
            type: 'number',
            description: 'Minimum confidence for signals (0-100)',
            minimum: 0,
            maximum: 100,
          },
        },
        required: ['watchlistId', 'inputSymbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getAgents',
      description: 'Get all scheduled agents for the current user',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createAgent',
      description: 'Create a new scheduled agent to automatically analyze trading pairs',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the agent',
          },
          intervalMinutes: {
            type: 'number',
            description: 'How often to run the agent (in minutes)',
            enum: [30, 60, 120, 240, 360, 720, 1440],
          },
          pairs: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Trading pairs to monitor (e.g., ["BTC/USD", "ETH/USD"])',
          },
          strategies: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'momentum',
                'trend',
                'reversal',
                'breakout',
                'scalping',
                'swing',
              ],
            },
            description: 'Strategies to use for analysis',
          },
          minConfidence: {
            type: 'number',
            description: 'Minimum confidence threshold (0-100)',
            minimum: 0,
            maximum: 100,
          },
        },
        required: ['name', 'intervalMinutes', 'pairs'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'toggleAgent',
      description: 'Activate or pause a scheduled agent',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'ID of the agent to toggle',
          },
          isActive: {
            type: 'boolean',
            description: 'Set to true to activate, false to pause',
          },
        },
        required: ['agentId', 'isActive'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSignals',
      description: 'Get active trading signals with optional filters',
      parameters: {
        type: 'object',
        properties: {
          minConfidence: {
            type: 'number',
            description: 'Minimum confidence filter (0-100)',
            minimum: 0,
            maximum: 100,
          },
          direction: {
            type: 'string',
            enum: ['buy', 'sell'],
            description: 'Filter by signal direction',
          },
          risk: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Filter by risk level',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyzeWatchlist',
      description: 'Analyze all trading pairs in a watchlist to generate new signals',
      parameters: {
        type: 'object',
        properties: {
          watchlistId: {
            type: 'string',
            description: 'ID of the watchlist to analyze',
          },
        },
        required: ['watchlistId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getMarketData',
      description: 'Get current market data for specific trading pairs',
      parameters: {
        type: 'object',
        properties: {
          pairs: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Trading pairs to fetch data for',
          },
        },
        required: ['pairs'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateAlertSettings',
      description: 'Update alert notification settings for the user',
      parameters: {
        type: 'object',
        properties: {
          emailEnabled: {
            type: 'boolean',
            description: 'Enable email notifications',
          },
          discordEnabled: {
            type: 'boolean',
            description: 'Enable Discord notifications',
          },
          minConfidenceThreshold: {
            type: 'number',
            description: 'Minimum confidence for alerts (0-100)',
            minimum: 0,
            maximum: 100,
          },
          alertOnBuySignals: {
            type: 'boolean',
            description: 'Send alerts for buy signals',
          },
          alertOnSellSignals: {
            type: 'boolean',
            description: 'Send alerts for sell signals',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculateRiskStrategy',
      description: 'Calculate a risk-adjusted trading strategy based on a financial goal',
      parameters: {
        type: 'object',
        properties: {
          targetAmount: {
            type: 'number',
            description: 'Target profit amount in USD',
          },
          timeframeDays: {
            type: 'number',
            description: 'Timeframe to achieve the goal (in days)',
          },
          currentCapital: {
            type: 'number',
            description: 'Current trading capital in USD (optional)',
          },
          riskTolerance: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'User risk tolerance level',
          },
        },
        required: ['targetAmount', 'timeframeDays'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recommendPairs',
      description: 'Recommend trading pairs based on volatility and goals',
      parameters: {
        type: 'object',
        properties: {
          goal: {
            type: 'string',
            description: 'Trading goal (e.g., "high returns", "stable growth")',
          },
          riskTolerance: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Risk tolerance',
          },
          count: {
            type: 'number',
            description: 'Number of pairs to recommend',
            minimum: 1,
            maximum: 20,
          },
        },
        required: ['goal'],
      },
    },
  },
];
