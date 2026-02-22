# MarginGuard AI - Claude Agent Instructions

## Project Overview
MarginGuard AI is an HVAC portfolio management platform that uses AI to identify margin risks and provide recovery recommendations. The application has been redesigned with a professional, enterprise-grade aesthetic featuring proper light/dark theme support and custom SVG assets.

## Design System

### Color Palette
- **Primary**: Blue (#3B82F6 / hsl(221 83% 53%)) - Main brand color for CTAs and emphasis
- **Background (Light)**: White (#FFFFFF)
- **Background (Dark)**: Navy (#0F172A / hsl(222 47% 11%))
- **Text**: Balanced contrast between light/dark modes
- **Accent**: Secondary blue tones for hover states and backgrounds

### Typography
- **Font**: Inter (sans-serif)
- **Hierarchy**: Clear heading structure (h1: 5xl-6xl, h2: 2xl-4xl, body: base-xl)

### Components
All UI components follow shadcn/ui patterns with custom theming applied via CSS variables in globals.css.

## Page Structure

### 1. Home Page (/)
- Hero section with value proposition
- Feature visualization showing AI analysis
- Call-to-action buttons to Agent and Vision pages
- Clean navigation bar with theme toggle

### 2. Agent Page (/agent)
- Full-screen chat interface for AI interaction
- Suggested prompts for quick starts
- Real-time message streaming
- Proper loading states

### 3. Reports Page (/reports)
- Portfolio analysis overview
- Card-based layout for different report types
- Back button for navigation
- Placeholder for future report functionality

### 4. Vision Page (/vision)
- Company mission and values
- Feature explanations with icons
- Clean typography and spacing
- Back button for navigation

## Navigation
- Persistent top navigation bar across all pages
- Logo links to home page
- Active page highlighting
- Theme toggle in top-right corner
- Mobile-responsive (planned)

## Key Features Implemented

### Theme Support
- Light and dark mode via next-themes
- CSS variables for all colors
- Smooth transitions between themes
- System preference detection

### Custom SVG Assets
- Logo component with shield icon
- All icons from lucide-react (no emojis)
- Consistent icon sizing (h-4 w-4 for small, h-6 w-6 for medium)

### Professional Design
- Removed all emoji usage
- Eliminated cheap-looking phone mockup
- Clean, modern B2B SaaS aesthetic
- Proper spacing and typography hierarchy
- Enterprise-grade visual design

## Development Notes

### File Structure
```
app/
├── page.tsx          # Home/landing page
├── agent/page.tsx    # AI chat interface
├── reports/page.tsx  # Portfolio reports
├── vision/page.tsx   # Company vision
├── layout.tsx        # Root layout with theme provider
└── globals.css       # Theme variables and base styles

components/
├── navigation.tsx    # Top nav bar
├── logo.tsx         # Custom logo SVG
├── theme-toggle.tsx # Light/dark mode toggle
├── theme-provider.tsx # Theme context provider
├── chat.tsx         # Chat interface
└── ui/              # shadcn components
```

### Key Dependencies
- Next.js 14.2+ (App Router)
- React 18.3
- next-themes for theme switching
- @ai-sdk/react for AI chat
- lucide-react for icons
- Tailwind CSS for styling

## Agent Instructions

When working on this project:

1. **Design Consistency**: Always use the established color palette and design tokens from globals.css
2. **No Emojis**: Use lucide-react icons instead
3. **Navigation**: Ensure all pages have proper back buttons or navigation
4. **Theme Support**: Test changes in both light and dark modes
5. **Typography**: Follow the established hierarchy and use Inter font
6. **Spacing**: Maintain consistent padding/margin (p-4, p-6, py-12, etc.)
7. **Professional Aesthetic**: Keep B2B SaaS look - clean, modern, trustworthy

## Future Enhancements
- Mobile responsive navigation menu
- Actual report data integration
- User authentication
- Project dashboard with real data
- Advanced filtering and search
