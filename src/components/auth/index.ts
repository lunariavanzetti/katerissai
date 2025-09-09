// Authentication Components Export for Kateriss AI Video Generator
// Complete authentication system with brutalist design

// =============================================================================
// AUTHENTICATION COMPONENTS
// =============================================================================

// Route Protection
export { AuthGuard, RequireAuth, AdminGuard } from './AuthGuard';
export type { AuthGuardProps } from '../../types/auth';

// Authentication Forms
export { LoginForm, CompactLoginForm } from './LoginForm';
export { SignUpForm } from './SignUpForm';
export { PasswordReset, ForgotPasswordForm, ResetPasswordForm } from './PasswordReset';

// Profile Management
export { ProfileSettings } from './ProfileSettings';

// =============================================================================
// CONTEXT AND HOOKS EXPORTS (Re-exported for convenience)
// =============================================================================

// Auth Context
export { 
  AuthProvider,
  useAuthContext,
  useAuthStatus,
  useAuthUser,
  useAuthActions,
  withAuth,
  AuthErrorBoundary
} from '../../contexts/AuthContext';

// Auth Hooks
export { useAuth } from '../../hooks/useAuth';
export { useProfile, usePublicProfile } from '../../hooks/useProfile';

// =============================================================================
// SERVICES (Re-exported for convenience)
// =============================================================================

export { authService } from '../../services/auth';
export { profileService } from '../../services/profile';

// =============================================================================
// CONFIGURATION (Re-exported for convenience)
// =============================================================================

export { supabase } from '../../config/supabase';
export { env } from '../../config/env';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Auth State Types
  AuthState,
  AuthContextType,
  UseAuthReturn,
  UseProfileReturn,

  // Credential Types
  SignUpCredentials,
  SignInCredentials,
  PasswordResetCredentials,
  UpdatePasswordCredentials,

  // User Profile Types
  UserProfile,
  UserPreferences,
  ProfileUpdateData,

  // Auth Provider Types
  AuthProvider,
  ProviderConfig,

  // Auth Result Types
  AuthResult,
  AuthActionResult,

  // Validation Types
  ValidationRules,
  FormErrors,

  // Component Props Types
  AuthFormProps,
  ProfileSettingsProps,

  // Event Types
  AuthEventType,
  AuthEvent,

  // Utility Types
  AuthLoadingState,
  AuthErrorDetails,
} from '../../types/auth';

// =============================================================================
// USAGE EXAMPLES AND DOCUMENTATION
// =============================================================================

/**
 * QUICK START GUIDE
 * 
 * 1. Wrap your app with AuthProvider:
 *    ```tsx
 *    import { AuthProvider } from './components/auth';
 *    
 *    function App() {
 *      return (
 *        <AuthProvider>
 *          <YourAppComponents />
 *        </AuthProvider>
 *      );
 *    }
 *    ```
 * 
 * 2. Protect routes with AuthGuard:
 *    ```tsx
 *    import { AuthGuard } from './components/auth';
 *    
 *    function ProtectedPage() {
 *      return (
 *        <AuthGuard>
 *          <YourProtectedContent />
 *        </AuthGuard>
 *      );
 *    }
 *    ```
 * 
 * 3. Use auth state in components:
 *    ```tsx
 *    import { useAuthUser, useAuthActions } from './components/auth';
 *    
 *    function UserProfile() {
 *      const { user, fullName } = useAuthUser();
 *      const { signOut } = useAuthActions();
 *      
 *      return (
 *        <div>
 *          <h1>Welcome, {fullName}!</h1>
 *          <button onClick={signOut}>Sign Out</button>
 *        </div>
 *      );
 *    }
 *    ```
 * 
 * 4. Create login/signup pages:
 *    ```tsx
 *    import { LoginForm, SignUpForm } from './components/auth';
 *    
 *    function LoginPage() {
 *      return <LoginForm redirectTo="/dashboard" />;
 *    }
 *    
 *    function SignUpPage() {
 *      return <SignUpForm redirectTo="/onboarding" />;
 *    }
 *    ```
 */

/**
 * ENVIRONMENT VARIABLES REQUIRED
 * 
 * Create a .env file in your project root:
 * 
 * ```env
 * # Supabase Configuration
 * VITE_SUPABASE_URL=your_supabase_project_url
 * VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
 * 
 * # App Configuration
 * VITE_APP_URL=http://localhost:5173
 * 
 * # Optional Auth Configuration
 * VITE_PASSWORD_MIN_LENGTH=8
 * VITE_SESSION_TIMEOUT_MINUTES=480
 * VITE_MAX_LOGIN_ATTEMPTS=5
 * ```
 */

/**
 * SUPABASE DATABASE SCHEMA
 * 
 * Run this SQL in your Supabase database:
 * 
 * ```sql
 * -- Create profiles table
 * create table public.profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   email text not null unique,
 *   full_name text,
 *   avatar_url text,
 *   bio text,
 *   website text,
 *   created_at timestamptz default now() not null,
 *   updated_at timestamptz default now() not null,
 *   last_login timestamptz,
 *   is_active boolean default true not null,
 *   preferences jsonb
 * );
 * 
 * -- Enable RLS
 * alter table public.profiles enable row level security;
 * 
 * -- Policies
 * create policy "Users can view own profile" 
 *   on public.profiles for select 
 *   using (auth.uid() = id);
 * 
 * create policy "Users can update own profile" 
 *   on public.profiles for update 
 *   using (auth.uid() = id);
 * 
 * -- Function to automatically create profile on signup
 * create or replace function public.handle_new_user() 
 * returns trigger as $$
 * begin
 *   insert into public.profiles (id, email, full_name)
 *   values (
 *     new.id, 
 *     new.email, 
 *     new.raw_user_meta_data->>'full_name'
 *   );
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 * 
 * -- Trigger to create profile on signup
 * create trigger on_auth_user_created
 *   after insert on auth.users
 *   for each row execute procedure public.handle_new_user();
 * 
 * -- Storage bucket for avatars
 * insert into storage.buckets (id, name, public) 
 * values ('profiles', 'profiles', true);
 * 
 * create policy "Users can upload own avatar" on storage.objects 
 *   for insert with check (bucket_id = 'profiles' and auth.uid()::text = (storage.foldername(name))[1]);
 * 
 * create policy "Public avatars are viewable" on storage.objects 
 *   for select using (bucket_id = 'profiles');
 * ```
 */