import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils.ts';
import { UserPlus, LogIn, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { fetchUserTeams, loginUser, signupUser } from '../service/service.ts';
import { useNavigate } from 'react-router-dom';

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'login' | 'signup';
}

export function AuthForm({ type, className, ...props }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) => password.length >= 6;

  const clearError = (field: string) => {
    setTimeout(() => {
      setFormErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }, 2000); // Clear error after 2 seconds
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validate all fields
    const errors: Record<string, string> = {};

    if (type === 'signup') {
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;

      if (!firstName) {
        errors.firstName = 'First name is required';
        clearError('firstName');
      }

      if (!lastName) {
        errors.lastName = 'Last name is required';
        clearError('lastName');
      }
    }

    if (!email) {
      errors.email = 'Email is required';
      clearError('email');
    } else if (!validateEmail(email)) {
      errors.email = 'Invalid email address';
      clearError('email');
    }

    if (!password) {
      errors.password = 'Password is required';
      clearError('password');
    } else if (!validatePassword(password)) {
      errors.password = 'Password must be at least 6 characters';
      clearError('password');
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setLoading(false);
      return;
    }

    // Proceed with signup/login
    try {
      if (type === 'signup') {
        const firstname = formData.get('firstName') as string;
        const lastname = formData.get('lastName') as string;

        const response = await signupUser({ firstname, lastname, email, password });
        alert(response.message);
        navigate('/login');
      }
      if (type === 'login') {
        const response = await loginUser({ email, password });
        alert(response.message); 
        sessionStorage.setItem("Token", response.token);
        sessionStorage.setItem("User",JSON.stringify(response.user));
        try {
          const teamsResponse = await fetchUserTeams(response.token,response.user.userId); 
          sessionStorage.setItem("Teams", JSON.stringify(teamsResponse));
        } catch (err) {
          console.error("Failed to fetch teams:", err.message);
        }
        navigate('/home'); 
    }
    } catch (err) {
      alert(err.message);
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  const inputVariants = {
    initial: { y: 20, opacity: 0 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
      },
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn('grid gap-6', className)}
      {...props}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {type === 'signup' && (
          <>
            <motion.div variants={inputVariants} initial="initial" animate="animate" custom={0}>
              <Input
                name="firstName"
                className="h-12 bg-white/50 border border-gray-100 shadow-sm placeholder:text-gray-400"
                placeholder="First name"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={loading}
                icon={<User className="h-5 w-5 text-gray-400" />}
              />
              {formErrors.firstName && <p className="text-red-500 text-sm">{formErrors.firstName}</p>}
            </motion.div>
            <motion.div variants={inputVariants} initial="initial" animate="animate" custom={0}>
              <Input
                name="lastName"
                className="h-12 bg-white/50 border border-gray-100 shadow-sm placeholder:text-gray-400"
                placeholder="Last name"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={loading}
                icon={<User className="h-5 w-5 text-gray-400" />}
              />
              {formErrors.lastName && <p className="text-red-500 text-sm">{formErrors.lastName}</p>}
            </motion.div>
          </>
        )}
        <motion.div variants={inputVariants} initial="initial" animate="animate" custom={type === 'signup' ? 1 : 0}>
          <Input
            name="email"
            className="h-12 bg-white/50 border border-gray-100 shadow-sm placeholder:text-gray-400"
            placeholder="Email address"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={loading}
            icon={<Mail className="h-5 w-5 text-gray-400" />}
          />
          {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
        </motion.div>
        <motion.div variants={inputVariants} initial="initial" animate="animate" custom={type === 'signup' ? 2 : 1}>
          <div className="relative">
            <Input
              name="password"
              className="h-12 bg-white/50 border border-gray-100 shadow-sm placeholder:text-gray-400"
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              disabled={loading}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {formErrors.password && <p className="text-red-500 text-sm">{formErrors.password}</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white shadow-md"
            disabled={loading}
          >
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Please wait
              </motion.div>
            ) : (
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {type === 'login' ? (
                  <>
                    <LogIn className="h-5 w-5" /> Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" /> Create Account
                  </>
                )}
              </motion.div>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
