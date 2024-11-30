import { AuthForm } from '../components/auth/auth-form';
import { AuthLayout } from '../components/auth/auth-layout';
import { AnimatedLock } from '../components/auth/animated-lock';
import { motion } from 'framer-motion';

export function SignupPage() {
  return (
    <AuthLayout image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <AnimatedLock />
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Create account
        </h1>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          Enter your details to create your account
        </p>
      </motion.div>
      <AuthForm type="signup" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="px-8 text-center text-sm text-gray-500"
      >
        Already have an account?{' '}
        <a href="/login" className="text-blue-500 hover:text-pink-500 transition-colors">
          Sign in
        </a>
      </motion.p>
    </AuthLayout>
  );
}