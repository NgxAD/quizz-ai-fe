# Quizz Frontend

A modern web application for creating and taking quizzes, built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

### For Teachers
- 📝 Create questions manually (Multiple Choice, True/False, Short Answer)
- 🤖 Generate questions using AI
- 📋 Create and manage exams
- 📊 View student submissions and results
- 📚 Organize questions by subjects

### For Students
- 📖 Browse available exams
- ⏱️ Take exams with timer
- 📝 Answer questions in various formats
- 📈 View results and score history

### Authentication
- User registration and login
- Google OAuth integration
- JWT token-based authentication
- Role-based access control (Teacher/Student)

## Project Structure

```
src/
├── api/                    # API client modules
│   ├── axiosClient.ts     # Axios configuration with interceptors
│   ├── auth.api.ts        # Authentication API calls
│   ├── question.api.ts    # Question management API
│   ├── exam.api.ts        # Exam management API
│   ├── submission.api.ts  # Submission API
│   └── ai.api.ts          # AI generation API
│
├── auth/
│   ├── Login.tsx          # Login page
│   └── Register.tsx       # Registration page
│
├── layouts/
│   ├── TeacherLayout.tsx  # Teacher dashboard layout
│   └── StudentLayout.tsx  # Student dashboard layout
│
├── pages/
│   ├── teacher/
│   │   ├── dashboard.tsx
│   │   ├── questions/
│   │   │   ├── create.tsx
│   │   │   └── list.tsx
│   │   ├── exams/
│   │   │   ├── create.tsx
│   │   │   └── list.tsx
│   │   └── ai/
│   │       └── generate.tsx
│   │
│   └── student/
│       ├── exams.tsx
│       ├── do-exam.tsx
│       └── result.tsx
│
├── components/
│   ├── QuestionForm.tsx   # Form for creating questions
│   ├── ExamCard.tsx       # Exam card component
│   └── Timer.tsx          # Countdown timer
│
├── store/
│   └── auth.store.ts      # Zustand auth state management
│
└── utils/
    ├── helpers.ts         # Utility functions
    └── hooks.ts           # Custom React hooks
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. Run development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## Key Technologies

- **Next.js** 16.1.4 - React framework with App Router
- **React** 19.2.3 - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** 4 - Utility-first CSS framework
- **Axios** - HTTP client
- **Zustand** - State management
- **js-cookie** - Cookie management

## API Integration

The frontend connects to the backend API (quizz-be) running on `http://localhost:3000/api`.

### Authentication Flow
1. User registers/logs in
2. Backend returns JWT token and user info
3. Token stored in cookie and Zustand store
4. Token automatically added to API request headers
5. Invalid tokens trigger redirect to login

### Example API Call
```typescript
import authApi from '@/api/auth.api';

const response = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
});
```

## State Management

Using Zustand for auth state:
```typescript
import { useAuthStore } from '@/store/auth.store';

export default function MyComponent() {
  const { user, token, login, logout } = useAuthStore();
  
  // Use auth state
}
```

## Protected Routes

Routes are protected using custom hooks:
- `useProtectedRoute()` - Redirect to login if not authenticated
- `useTeacherRoute()` - Ensure user is teacher
- `useStudentRoute()` - Ensure user is student

## Available Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Linting
npm run lint
```

## Styling

- Tailwind CSS for utility-first styling
- Global styles in `app/globals.css`
- Component-level Tailwind classes
- Responsive design with Tailwind breakpoints

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Real-time collaboration features
- Question bank search and filtering
- Detailed analytics and statistics
- Export exam results to PDF
- Mobile app version
- Video explanation support
- Peer review functionality

## Troubleshooting

### API Connection Issues
- Ensure backend is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS configuration in backend

### Authentication Issues
- Clear browser cookies
- Check token expiration
- Verify JWT secret matches backend

### Build Errors
- Run `npm install` again
- Delete `node_modules` and `.next` folder
- Ensure Node.js version is 18+

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
