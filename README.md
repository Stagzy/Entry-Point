# Entry Point - Enterprise Giveaway Platform 🚀

A production-ready promotional marketing platform that enables verified creators to host transparent giveaways while participants enter for exciting prizes. Built with React Native, Supabase, and enterprise-grade architecture.

## ✨ Current Status: **LIVE ON TESTFLIGHT** 

- 🎯 **Version**: 1.0.1 (Build 12)
- 📱 **Platform**: iOS TestFlight (submitted 9/6/2025)
- 🏗️ **Architecture**: Production-ready with real Supabase backend
- 🔐 **Features**: Complete trust tier system, real-time updates, payment processing

## 🏆 Key Features

### 🎖️ **Trust Tier System**
- **5-Tier Structure**: Bronze → Silver → Gold → Platinum → Diamond
- **Privilege-Based**: Higher tiers unlock more giveaway creation privileges
- **Creator Verification**: Verified creators get enhanced trust levels
- **Real Database**: PostgreSQL with comprehensive privilege management

### 💳 **Payment & Commerce**
- **Stripe Integration**: Secure payment processing for entries
- **RevenueCat**: iOS/Android in-app purchases
- **Creator Payouts**: Stripe Connect for creator earnings
- **Payment Methods**: Save and manage multiple payment options

### ⚡ **Real-Time Features**
- **Live Activity Feeds**: Real-time giveaway updates and social interactions
- **Entry Tracking**: Live entry counts with progress indicators
- **Winner Announcements**: Instant notifications and celebrations
- **Subscription Management**: Efficient WebSocket connections

### 📊 **Analytics & Insights**
- **Creator Dashboard**: Comprehensive revenue and performance metrics
- **User Analytics**: Entry history, spending patterns, win rates
- **Admin Console**: Platform-wide statistics and management tools
- **ROI Tracking**: Business intelligence for creators

## ⚖️ Legal Compliance & Positioning

**Entry Point is designed as a promotional marketing platform, NOT a lottery or gambling service.**

### Key Legal Distinctions:
- **Promotional Campaigns**: All activities are structured as legitimate promotional marketing campaigns
- **Consideration for Value**: Participants pay for marketing services and social media engagement opportunities
- **Skill-Based Elements**: Winners are selected through engagement metrics and promotional criteria
- **Transparent Terms**: All campaigns include clear terms, conditions, and promotional rules
- **Creator Partnerships**: Facilitates brand partnerships and influencer marketing collaborations

### Compliance Features:
- Clear promotional terms and conditions for each campaign
- Age verification and geographic restrictions where required
- Transparent winner selection processes
- Proper tax documentation and reporting capabilities
- Social media engagement verification systems

## Features

### 🎯 Core Features
- **User Authentication** - Registration, login with email/password and social media
- **Campaign Creation** - Content creators can create and manage promotional campaigns
- **Entry Purchase System** - Users can buy campaign entries with flexible quantity options
- **Social Media Integration** - Verify social follows for bonus entries and engagement
- **Creator Verification** - Verified creator system with badges and partnership status
- **Real-time Progress** - Live entry sales tracking and campaign progress bars

### 📱 User Experience
- **Clean UI/UX** - Modern, intuitive interface with iOS/Android design patterns
- **Category Filtering** - Browse campaigns by category (Tech, Gaming, Lifestyle, Cash)
- **Search Functionality** - Find specific campaigns or creators
- **User Profiles** - Comprehensive profile management with participation stats
- **Payment Integration** - Multiple payment methods (Credit Card, PayPal, Apple Pay, Google Pay)

### 🔧 Technical Features
- **React Native** - Cross-platform mobile app
- **Expo** - Rapid development and deployment
- **React Navigation** - Smooth navigation between screens
- **Context API** - State management for authentication and user data
- **TypeScript Ready** - Easily convertible to TypeScript
- **Modular Architecture** - Well-organized code structure

## Project Structure

```
entry-point/
├── App.js                          # Main app component
├── src/
│   ├── context/
│   │   └── AuthContext.js          # Authentication state management
│   ├── navigation/
│   │   └── AppNavigator.js         # Main navigation structure
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.js      # User login
│       │   └── RegisterScreen.js   # User registration
│       ├── CreateGiveawayScreen.js # Create new giveaway
│       ├── GiveawayDetailScreen.js # Individual giveaway details
│       ├── GiveawaysScreen.js      # Browse all giveaways
│       ├── HomeScreen.js           # Main dashboard
│       ├── ProfileScreen.js        # User profile management
│       └── TicketPurchaseScreen.js # Ticket buying interface
├── assets/                         # Images and icons
└── package.json                    # Dependencies
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   cd entry-point
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   This project requires API credentials from several services. See [ENVIRONMENT_SETUP.md](./docs/ENVIRONMENT_SETUP.md) for detailed instructions on obtaining and configuring:
   
   - **Supabase** (Database and authentication backend)
   - **Google OAuth** (Sign-in provider)
   - **Apple Sign-In** (iOS native authentication)
   - **Stripe** (Payment processing)
   
   Quick start:
   ```bash
   # Copy the example environment file
   cp supabase/.env.example supabase/.env
   
   # Edit with your actual credentials
   # Add EXPO_PUBLIC_* variables to .env.local file
   ```

4. **Start the development server**
   ```bash
   npm start
   ```


4. **Run on device/simulator**
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

## Key Components

### Authentication System
- Email/password registration and login
- Social media authentication (Google, Apple)
- Creator account type selection
- Persistent authentication state

### Giveaway Management
- **Create Giveaways**: Rich form with image upload, social requirements
- **Browse Giveaways**: Category filtering, search, progress tracking
- **Giveaway Details**: Complete information, social tasks, sharing
- **Ticket Purchase**: Flexible quantity selection, multiple payment methods

### Social Media Integration
Social media verification system for bonus entries:
- Instagram follow verification
- Twitter/X follow verification  
- YouTube subscription verification
- TikTok follow verification

### User Experience Features
- Pull-to-refresh on lists
- Loading states and error handling
- Responsive design for all screen sizes
- Haptic feedback and animations
- Share functionality for giveaways

## Future Enhancements

### Backend Integration
- **User Authentication API** - JWT-based authentication
- **Giveaway Management API** - CRUD operations for giveaways
- **Payment Processing** - Stripe/PayPal integration
- **Social Media API** - Automated verification of follows/subscriptions
- **Push Notifications** - Winner announcements, giveaway updates
- **Analytics Dashboard** - Creator insights and statistics

### Advanced Features
- **Live Streaming Integration** - Host giveaways during live streams
- **Referral System** - Earn bonus entries for referring friends
- **Subscription Model** - Premium creator features
- **Advanced Analytics** - Detailed performance metrics
- **Multi-language Support** - Internationalization
- **Dark Mode** - Theme switching capability

### Social Features
- **Comments System** - User engagement on giveaways
- **Creator Following** - Follow favorite creators
- **Leaderboards** - Top participants and creators
- **Achievement System** - Badges and rewards
- **Social Sharing** - Enhanced sharing with custom graphics

## Technology Stack

- **React Native** - Mobile app framework
- **Expo** - Development platform and tools
- **React Navigation** - Navigation library
- **Expo Vector Icons** - Icon library
- **Expo Image Picker** - Image selection functionality
- **Context API** - State management

## Contributing

We welcome contributions to Entry Point! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) guide for:

- How to report bugs
- How to suggest features
- Development setup instructions
- Code style guidelines
- Pull request process

Key areas for contribution:

1. **Backend Development** - API implementation and database design
2. **Payment Integration** - Real payment processing
3. **Social Media APIs** - Automated verification systems
4. **UI/UX Enhancements** - Animation and interaction improvements
5. **Testing** - Unit and integration tests
6. **Performance Optimization** - Code splitting and lazy loading

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** - see the [LICENSE](LICENSE) file for details.

**In summary**: Entry Point is open source and you can use it freely, modify it, and help improve it. However, if you distribute your modifications or host a modified version, you must share your source code under the same license. This ensures improvements to the platform benefit the community.

For the full license text and details, visit: https://www.gnu.org/licenses/agpl-3.0.html

## ⚠️ Legal Disclaimer

**IMPORTANT LEGAL NOTICE:**

Entry Point is designed as a promotional marketing platform. Before deploying this application commercially, you MUST:

1. **Consult Legal Counsel**: Engage qualified legal professionals familiar with:
   - Local and federal gambling laws
   - Promotional marketing regulations  
   - Consumer protection laws
   - Digital commerce regulations

2. **Verify Regulatory Compliance**: Ensure compliance with:
   - State and federal promotional/sweepstakes laws
   - FTC guidelines for endorsements and promotions
   - Platform-specific terms of service (Apple App Store, Google Play)
   - International regulations if operating globally

3. **Implement Required Disclosures**:
   - Clear terms and conditions for each campaign
   - Prize value disclosures and tax implications
   - Winner selection methodology
   - Geographic and age restrictions
   - Proper contest/promotion disclaimers

4. **Consider Insurance**: Promotional campaign insurance and liability coverage

**This software is provided as-is for educational and development purposes. The developers assume no responsibility for legal compliance in commercial deployments.**

## Getting Started with Your Own Backend

To fully implement this app, you'll need to create a backend with the following endpoints:

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - User logout

### Campaign Endpoints
- `GET /campaigns` - List all promotional campaigns
- `GET /giveaways/:id` - Get specific giveaway
- `POST /giveaways` - Create new giveaway
- `PUT /giveaways/:id` - Update giveaway
- `DELETE /giveaways/:id` - Delete giveaway

### Ticket Endpoints
- `POST /tickets/purchase` - Purchase tickets
- `GET /tickets/user/:id` - Get user's tickets
- `POST /tickets/verify-winner` - Verify winner

### Social Verification Endpoints
- `POST /social/verify-instagram` - Verify Instagram follow
- `POST /social/verify-twitter` - Verify Twitter follow
- `POST /social/verify-youtube` - Verify YouTube subscription
- `POST /social/verify-tiktok` - Verify TikTok follow

This foundation provides a solid starting point for building a complete giveaway platform!
