
# SpyTradr 2.0

> AI-Powered Cryptocurrency Trading Signals Platform with Technical Analysis, Watchlists, and Automated Trading Agents

SpyTradr is a comprehensive cryptocurrency trading platform that combines real-time market analysis, technical indicators, watchlist management, and automated trading agents to help traders make informed decisions.

## 🚀 Features

### Core Features
- **Smart Watchlists**: Create and manage custom watchlists with multiple cryptocurrency trading pairs
- **Technical Analysis Engine**: Advanced technical indicators including RSI, MACD, Bollinger Bands, EMA, SMA, and Volume Analysis
- **Trading Signals**: AI-generated buy/sell signals with confidence scores and risk levels
- **Scheduled Agent System**: Automated agents that monitor markets and generate signals 24/7
- **Real-time Market Data**: Integration with Kraken Exchange API for live OHLCV data
- **User Authentication**: Secure authentication powered by Clerk.dev

### Technical Indicators
- Relative Strength Index (RSI)
- Moving Average Convergence Divergence (MACD)
- Bollinger Bands
- Exponential Moving Average (EMA)
- Simple Moving Average (SMA)
- Volume Analysis & On-Balance Volume (OBV)

### Trading Strategies
- RSI Oversold/Overbought
- MACD Crossover
- Bollinger Breakout
- EMA Crossover (Fast/Slow)
- Trend Following
- Mean Reversion

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components
- **Radix UI** primitives

### Backend
- **Next.js API Routes**
- **PostgreSQL** (Supabase)
- **Drizzle ORM**
- **Server Actions**

### Authentication & Payments
- **Clerk.dev** for authentication
- **Whop** for payment processing

### APIs & Data
- **Kraken API** (Public endpoints)
- Market data caching with Next.js

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/seantuckercm/spytradr2.0.git
cd spytradr2.0/nextjs_space
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
Create a `.env` file in the `nextjs_space` directory with the following variables:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Whop Payment Processing
WHOP_API_KEY=your_whop_api_key
WHOP_WEBHOOK_SECRET=your_whop_webhook_secret

# Cron Jobs (for scheduled agents)
CRON_SECRET=your_random_secure_string
```

4. Run database migrations:
```bash
yarn tsx scripts/migrate.ts
```

5. Start the development server:
```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🗂️ Project Structure

```
nextjs_space/
├── actions/              # Server actions
│   ├── agent-actions.ts
│   ├── profile-actions.ts
│   ├── signal-actions.ts
│   └── watchlist-actions.ts
├── app/                  # Next.js app directory
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Protected dashboard pages
│   ├── (marketing)/     # Public marketing pages
│   └── api/             # API routes
├── components/           # React components
│   ├── agents/          # Agent management components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components
│   ├── marketing/       # Marketing page components
│   ├── settings/        # Settings components
│   ├── signals/         # Signal display components
│   ├── watchlist/       # Watchlist management components
│   └── ui/              # shadcn/ui components
├── db/                   # Database configuration
│   ├── migrations/      # Drizzle migrations
│   └── schema/          # Database schemas
├── lib/                  # Utility libraries
│   ├── agents/          # Agent processing logic
│   ├── analysis/        # Signal generation logic
│   ├── api/             # API clients (Kraken)
│   ├── auth/            # Authentication utilities
│   ├── constants/       # App constants
│   ├── indicators/      # Technical indicators
│   └── validators/      # Zod schemas
└── scripts/             # Utility scripts
```

## 🔐 Authentication Setup

1. Create a Clerk account at [clerk.dev](https://clerk.dev)
2. Create a new application
3. Copy the API keys to your `.env` file
4. Configure the webhook endpoint: `/api/webhooks/clerk`
5. Enable email/password authentication in Clerk dashboard

## 💳 Payment Setup (Optional)

1. Create a Whop account at [whop.com](https://whop.com)
2. Configure your products/plans
3. Copy API keys to `.env` file
4. Set up webhook endpoint: `/api/webhooks/whop`

## 🤖 Scheduled Agents

SpyTradr includes a powerful scheduled agent system that runs automated market analysis:

1. Agents can be configured to run at specific intervals (5min, 15min, 30min, 1h, 4h, 1d)
2. Each agent monitors specific trading pairs
3. Agents apply multiple trading strategies simultaneously
4. Generated signals are stored with confidence scores and risk levels
5. Jobs are tracked with full logging for debugging

### Setting up Cron Jobs (Vercel)

In your Vercel project settings, add two cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/agents",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/agents/worker",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

## 📊 Database Schema

The application uses PostgreSQL with Drizzle ORM. Key tables include:

- `profiles`: User profiles and subscription tiers
- `watchlists`: User-created watchlists
- `watchlist_items`: Trading pairs in watchlists
- `signals`: Generated trading signals
- `ohlcv_data`: Historical price data cache
- `scheduled_agents`: Agent configurations
- `scheduled_agent_jobs`: Agent execution jobs
- `scheduled_agent_logs`: Agent execution logs
- `trading_pairs`: Kraken trading pair metadata

## 🎯 Usage

### Creating a Watchlist

1. Navigate to **Watchlists** in the dashboard
2. Click **Create Watchlist**
3. Enter a name and description
4. Set default confidence threshold
5. Add trading pairs (e.g., BTC/USD, ETH/USD)
6. Configure timeframes and strategies for each pair

### Analyzing Signals

1. Click **Analyze** on any watchlist
2. The system fetches OHLCV data from Kraken
3. Technical indicators are calculated
4. Signals are generated based on configured strategies
5. View signals in the **Signals** page with entry/exit prices

### Creating an Automated Agent

1. Navigate to **Agents** in the dashboard
2. Click **Create Agent**
3. Configure:
   - Agent name
   - Run interval
   - Trading pairs to monitor
   - Strategies to apply
   - Minimum confidence threshold
4. Agent will automatically analyze markets and generate signals

## 🔒 Security Features

- Server-side authentication with Clerk
- Protected API routes with auth middleware
- Webhook signature verification
- Secure credential storage
- Input validation with Zod schemas
- SQL injection protection with Drizzle ORM

## 📈 Subscription Tiers

- **Free**: Basic features, limited watchlists
- **Basic**: More watchlists and pairs
- **Pro**: Unlimited watchlists, advanced features
- **Enterprise**: Custom limits, priority support

## 🚧 Roadmap

- [ ] Real-time WebSocket updates
- [ ] More exchange integrations
- [ ] Portfolio tracking
- [ ] Backtesting engine
- [ ] Mobile app
- [ ] Advanced chart visualizations
- [ ] Social trading features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🐛 Bug Reports & Feature Requests

Please open an issue on GitHub if you encounter any problems or have feature suggestions.

## 👨‍💻 Author

Built with ❤️ by the SpyTradr team

## 🙏 Acknowledgments

- [Kraken](https://www.kraken.com/) for their excellent public API
- [Clerk](https://clerk.dev/) for authentication
- [Whop](https://whop.com/) for payment processing
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Vercel](https://vercel.com/) for hosting

---

**⚠️ Disclaimer**: Trading cryptocurrencies carries risk. The signals generated by this platform are for informational purposes only and should not be considered financial advice. Always do your own research and never invest more than you can afford to lose.
