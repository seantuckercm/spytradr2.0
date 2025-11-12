
import { getProfile } from '@/actions/profile-actions';
import {
  getWatchlists,
  createWatchlist as createWatchlistAction,
  addWatchlistItem as addWatchlistItemAction,
} from '@/actions/watchlist-actions';
import {
  getUserAgents,
  createAgentAction,
  toggleAgentActiveAction,
} from '@/actions/agent-actions';
import {
  getUserSignals,
  analyzeWatchlist as analyzeWatchlistAction,
} from '@/actions/signal-actions';
import { 
  updateAlertConfig, 
  getAlertConfig,
  getAlertHistory as getAlertHistoryAction,
} from '@/actions/alert-actions';
import {
  getUserBacktests,
  createBacktest as createBacktestAction,
  runBacktest as runBacktestAction,
  getBacktest,
} from '@/actions/backtest-actions';
import {
  getPerformanceSnapshots,
  getJournalEntries as getJournalEntriesAction,
  createJournalEntry as createJournalEntryAction,
} from '@/actions/performance-actions';
import { scanMarket as scanMarketAction } from '@/actions/scanner-actions';
import { getKrakenTicker } from '@/lib/api/kraken';
import { ToolExecutionResult } from './types';

/**
 * Execute a platform tool based on the tool name and parameters
 */
export async function executePlatformTool(
  toolName: string,
  parameters: Record<string, any>,
  userId: string
): Promise<ToolExecutionResult> {
  try {
    switch (toolName) {
      case 'getUserProfile': {
        const result = await getProfile();
        if (!result || !result.success || !result.data) {
          return {
            success: false,
            error: result?.error || 'Profile not found',
          };
        }
        const profile = result.data;
        return {
          success: true,
          data: {
            membership: profile.membership,
            status: profile.status,
            email: profile.email,
            customLimits: profile.customLimits,
            preferences: profile.preferences,
          },
          displayMessage: `Profile retrieved: ${profile.membership} tier`,
        };
      }

      case 'getWatchlists': {
        const result = await getWatchlists();
        if (!result || !result.success || !result.data) {
          return {
            success: false,
            error: result?.error || 'Failed to get watchlists',
          };
        }
        return {
          success: true,
          data: result.data,
          displayMessage: `Found ${result.data.length} watchlist(s)`,
        };
      }

      case 'createWatchlist': {
        const result = await createWatchlistAction({
          name: parameters.name,
          description: parameters.description || '',
          defaultConfidenceThreshold: parameters.defaultConfidenceThreshold || 70,
        });
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }
        return {
          success: true,
          data: result.data,
          displayMessage: `Created watchlist "${parameters.name}"`,
        };
      }

      case 'addWatchlistItem': {
        const result = await addWatchlistItemAction({
          watchlistId: parameters.watchlistId,
          inputSymbol: parameters.inputSymbol,
          timeframes: parameters.timeframes || ['1h', '4h', '1d'],
          strategies: parameters.strategies || ['momentum', 'trend'],
          confidenceThreshold: parameters.confidenceThreshold || 70,
        });
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }
        return {
          success: true,
          data: result.data,
          displayMessage: `Added ${parameters.inputSymbol} to watchlist`,
        };
      }

      case 'getAgents': {
        const result = await getUserAgents();
        if (!result || !result.success) {
          return {
            success: false,
            error: result?.error || 'Failed to get agents',
          };
        }
        return {
          success: true,
          data: result.agents,
          displayMessage: `Found ${result.agents.length} agent(s)`,
        };
      }

      case 'createAgent': {
        const strategiesFormatted = (parameters.strategies || ['momentum', 'trend']).map((s: string) => ({ id: s }));
        const result = await createAgentAction({
          name: parameters.name,
          intervalMinutes: parameters.intervalMinutes,
          pairs: parameters.pairs,
          strategies: strategiesFormatted,
          minConfidence: parameters.minConfidence || 70,
          timezone: 'UTC',
          concurrency: 1,
          maxRuntimeSeconds: 300,
          maxAttempts: 3,
        });
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }
        return {
          success: true,
          data: result.agent,
          displayMessage: `Created agent "${parameters.name}" running every ${parameters.intervalMinutes} minutes`,
        };
      }

      case 'toggleAgent': {
        const result = await toggleAgentActiveAction(
          parameters.agentId,
          parameters.isActive
        );
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }
        return {
          success: true,
          data: result.agent,
          displayMessage: `Agent ${parameters.isActive ? 'activated' : 'paused'}`,
        };
      }

      case 'getSignals': {
        const result = await getUserSignals();
        if (!result || !result.success) {
          return {
            success: false,
            error: result?.error || 'Failed to get signals',
          };
        }
        
        let filteredSignals = result.data || [];

        if (parameters.minConfidence) {
          filteredSignals = filteredSignals.filter(
            (s: any) => (s.signal?.confidence || 0) >= parameters.minConfidence
          );
        }
        if (parameters.direction) {
          filteredSignals = filteredSignals.filter(
            (s: any) => s.signal?.direction === parameters.direction
          );
        }
        if (parameters.risk) {
          filteredSignals = filteredSignals.filter(
            (s: any) => s.signal?.risk === parameters.risk
          );
        }

        return {
          success: true,
          data: filteredSignals,
          displayMessage: `Found ${filteredSignals.length} signal(s)`,
        };
      }

      case 'analyzeWatchlist': {
        const result = await analyzeWatchlistAction(parameters.watchlistId);
        if (!result.success || !result.data) {
          return {
            success: false,
            error: result.error,
          };
        }
        // Calculate total signals generated
        const totalSignals = result.data.results.reduce((sum: number, r: any) => {
          return sum + (r.result?.data?.signalsGenerated || 0);
        }, 0);
        return {
          success: true,
          data: result.data,
          displayMessage: `Analysis complete: ${result.data.itemsAnalyzed} pairs analyzed, ${totalSignals} signals generated`,
        };
      }

      case 'getMarketData': {
        const marketData = [];
        for (const pair of parameters.pairs || []) {
          try {
            const ticker = await getKrakenTicker(pair);
            if (ticker) {
              marketData.push({
                pair,
                ...ticker,
              });
            }
          } catch (error) {
            // Skip pairs that fail
            continue;
          }
        }
        return {
          success: true,
          data: marketData,
          displayMessage: `Fetched market data for ${marketData.length} pair(s)`,
        };
      }

      case 'updateAlertSettings': {
        const currentConfig = await getAlertConfig();
        const result = await updateAlertConfig({
          ...currentConfig,
          ...parameters,
        });
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }
        return {
          success: true,
          data: result.data,
          displayMessage: 'Alert settings updated',
        };
      }

      case 'calculateRiskStrategy': {
        const { targetAmount, timeframeDays, currentCapital, riskTolerance } =
          parameters;

        // Calculate required return percentage
        const requiredReturn = currentCapital
          ? (targetAmount / currentCapital) * 100
          : 0;
        const monthlyReturn = requiredReturn / (timeframeDays / 30);

        // Risk assessment
        let riskLevel = 'medium';
        let recommendedStrategies = ['momentum', 'trend'];
        let positionSizePercent = 5;

        if (riskTolerance === 'high' || monthlyReturn > 20) {
          riskLevel = 'high';
          recommendedStrategies = ['momentum', 'breakout', 'scalping'];
          positionSizePercent = 10;
        } else if (riskTolerance === 'low' || monthlyReturn < 10) {
          riskLevel = 'low';
          recommendedStrategies = ['trend', 'swing'];
          positionSizePercent = 2;
        }

        const strategy = {
          targetAmount,
          timeframeDays,
          currentCapital,
          requiredReturnPercent: requiredReturn,
          monthlyReturnTarget: monthlyReturn,
          riskLevel,
          recommendedStrategies,
          positionSizePercent,
          stopLossPercent: riskLevel === 'high' ? 3 : riskLevel === 'medium' ? 2 : 1,
          warnings: monthlyReturn > 25
            ? ['Extremely high return target requires aggressive risk-taking']
            : monthlyReturn > 15
            ? ['High return target requires significant risk']
            : [],
        };

        return {
          success: true,
          data: strategy,
          displayMessage: `Risk strategy calculated: ${riskLevel} risk, target ${monthlyReturn.toFixed(1)}% monthly return`,
        };
      }

      case 'recommendPairs': {
        const { goal, riskTolerance, count = 5 } = parameters;

        // Recommend pairs based on volatility and liquidity
        const pairRecommendations = [
          // High volatility pairs
          { pair: 'BTC/USD', volatility: 'high', liquidity: 'very high' },
          { pair: 'ETH/USD', volatility: 'high', liquidity: 'very high' },
          { pair: 'SOL/USD', volatility: 'very high', liquidity: 'high' },
          { pair: 'AVAX/USD', volatility: 'very high', liquidity: 'medium' },
          { pair: 'MATIC/USD', volatility: 'high', liquidity: 'medium' },
          // Medium volatility
          { pair: 'XRP/USD', volatility: 'medium', liquidity: 'high' },
          { pair: 'ADA/USD', volatility: 'medium', liquidity: 'high' },
          { pair: 'DOT/USD', volatility: 'medium', liquidity: 'medium' },
          // Low volatility
          { pair: 'USDT/USD', volatility: 'low', liquidity: 'very high' },
          { pair: 'USDC/USD', volatility: 'low', liquidity: 'very high' },
        ];

        let filtered = pairRecommendations;

        if (riskTolerance === 'high') {
          filtered = pairRecommendations.filter(
            (p) => p.volatility === 'very high' || p.volatility === 'high'
          );
        } else if (riskTolerance === 'low') {
          filtered = pairRecommendations.filter(
            (p) => p.volatility === 'medium' || p.volatility === 'low'
          );
        }

        const recommended = filtered.slice(0, count);

        return {
          success: true,
          data: recommended,
          displayMessage: `Recommended ${recommended.length} trading pairs for ${riskTolerance} risk tolerance`,
        };
      }

      // ===== BACKTESTING TOOLS =====
      case 'getBacktests': {
        const result = await getUserBacktests();
        if (!result || !result.success || !result.data) {
          return {
            success: false,
            error: result?.error || 'Failed to get backtests',
          };
        }
        return {
          success: true,
          data: result.data,
          displayMessage: `Found ${result.data.length} backtest(s)`,
        };
      }

      case 'createBacktest': {
        const result = await createBacktestAction({
          name: parameters.name,
          description: parameters.description || '',
          pairs: parameters.pairs,
          strategies: parameters.strategies,
          timeframe: parameters.timeframe,
          startDate: parameters.startDate,
          endDate: parameters.endDate,
          initialBalance: parameters.initialBalance || 10000,
          maxPositionSize: parameters.maxPositionSize || 0.1,
          stopLossPercent: parameters.stopLossPercent || 2,
          takeProfitPercent: parameters.takeProfitPercent || 5,
          minConfidence: parameters.minConfidence || 70,
        });
        
        if (!result.success || !result.data) {
          return {
            success: false,
            error: result.error,
          };
        }

        // Run the backtest
        const runResult = await runBacktestAction(result.data.id);
        if (!runResult.success) {
          return {
            success: false,
            error: `Backtest created but failed to run: ${runResult.error}`,
          };
        }

        return {
          success: true,
          data: runResult.data,
          displayMessage: `Backtest "${parameters.name}" created and executed successfully`,
        };
      }

      case 'getBacktestResults': {
        const result = await getBacktest(parameters.backtestId);
        if (!result || !result.success || !result.data) {
          return {
            success: false,
            error: result?.error || 'Backtest not found',
          };
        }
        return {
          success: true,
          data: result.data,
          displayMessage: `Retrieved backtest results: ${result.data.backtest.status}`,
        };
      }

      // ===== PERFORMANCE ANALYTICS TOOLS =====
      case 'getPerformanceSnapshot': {
        const result = await getPerformanceSnapshots(parameters.periodType || 'all_time');
        if (!result || !result.success || !result.data) {
          return {
            success: false,
            error: result?.error || 'Failed to get performance snapshot',
          };
        }
        
        const snapshot = result.data[0]; // Get the latest snapshot
        if (!snapshot) {
          return {
            success: true,
            data: null,
            displayMessage: 'No performance data available yet',
          };
        }

        return {
          success: true,
          data: snapshot,
          displayMessage: `Performance snapshot: ${snapshot.totalTrades} trades, ${snapshot.winRate?.toFixed(1)}% win rate`,
        };
      }

      case 'getJournalEntries': {
        const result = await getJournalEntriesAction(parameters.limit || 10);
        if (!result || !result.success || !result.data) {
          return {
            success: false,
            error: result?.error || 'Failed to get journal entries',
          };
        }
        return {
          success: true,
          data: result.data,
          displayMessage: `Found ${result.data.length} journal entry(ies)`,
        };
      }

      case 'createJournalEntry': {
        const result = await createJournalEntryAction({
          signalId: parameters.signalId || null,
          title: parameters.title,
          notes: parameters.notes || {},
          actualEntry: parameters.actualEntry || null,
          actualExit: parameters.actualExit || null,
          actualPnl: parameters.actualPnl || null,
          actualPnlPercent: parameters.actualPnl && parameters.actualEntry
            ? ((parameters.actualPnl / parameters.actualEntry) * 100)
            : null,
          rating: parameters.rating || null,
        });
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }
        
        return {
          success: true,
          data: result.data,
          displayMessage: `Journal entry "${parameters.title}" created`,
        };
      }

      // ===== MARKET SCANNER TOOLS =====
      case 'scanMarket': {
        const filters = {
          timeframe: parameters.timeframe || '1h',
          strategies: parameters.strategies || ['momentum', 'trend'],
          minConfidence: parameters.minConfidence || 70,
          direction: parameters.direction || undefined,
          risk: parameters.risk || undefined,
          baseAsset: parameters.baseAsset || undefined,
          quoteAsset: parameters.quoteAsset || undefined,
        };
        
        const result = await scanMarketAction(filters);
        if (!result || !result.success || !result.data) {
          return {
            success: false,
            error: result?.error || 'Market scan failed',
          };
        }
        
        return {
          success: true,
          data: result.data,
          displayMessage: `Market scan complete: ${result.data.opportunities?.length || 0} opportunities found`,
        };
      }

      // ===== ALERT MANAGEMENT TOOLS =====
      case 'getAlertHistory': {
        const result = await getAlertHistoryAction(parameters.limit || 20);
        if (!result || !result.success || !result.data) {
          return {
            success: false,
            error: result?.error || 'Failed to get alert history',
          };
        }
        return {
          success: true,
          data: result.data,
          displayMessage: `Found ${result.data.length} alert(s) in history`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
