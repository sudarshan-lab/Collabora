import { motion } from 'framer-motion';
import { cn } from '../../lib/utils.ts';

interface AuthLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  image: string;
  children: React.ReactNode;
}

export function AuthLayout({ image, children, className, ...props }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 via-white to-pink-50">
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <motion.div 
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="relative hidden h-full flex-col p-10 text-white lg:flex"
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                delay: 0.3,
                duration: 0.8,
                ease: "easeOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-blue-400/80 to-pink-400/80 z-10"
            />
            <motion.img
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2,
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1]
              }}
              src={image}
              width={1280}
              height={843}
              alt="Authentication"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: 0.6,
              duration: 0.8,
              ease: "easeOut"
            }}
            className="relative z-20 flex items-center text-lg font-medium"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-6 w-6"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              Collabora
            </motion.div>
          </motion.div>
        </motion.div>
        <div className={cn('lg:p-8', className)} {...props}>
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}