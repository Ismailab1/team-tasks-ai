import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, Brain, BarChart3, Shield, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import logo from '../assets/team-tasks-ai-logo.png';
import dashboard_img from '../assets/team-dashboard.png';

function Landing() {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get scroll progress for parallax effects
  const { scrollYProgress } = useScroll();
  
  // Transform scroll progress into values for parallax effects
  const heroBackgroundY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const heroContentY = useTransform(scrollYProgress, [0, 0.2], [0, -25]);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const slideFromLeft = {
    hidden: { x: -50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  const slideFromRight = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  const slideFromBottom = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  // New animation variants
  const popUp = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { 
        type: "spring",
        damping: 12,
        stiffness: 100
      } 
    }
  };
  
  const bounceIn = {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: "spring", 
        damping: 8, 
        stiffness: 100 
      } 
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header/Navigation with floating effect */}
      <motion.header 
        className="bg-white shadow-sm sticky top-0 z-50"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        style={{
          boxShadow: useTransform(
            scrollYProgress,
            [0, 0.05],
            ["0px 1px 2px rgba(0,0,0,0.05)", "0px 4px 12px rgba(0,0,0,0.1)"]
          )
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            variants={slideFromLeft}
            whileHover={{ scale: 1.05 }}
          >
            <motion.img 
              src={logo} 
              alt="Team Tasks AI Logo" 
              className="h-8 w-auto" 
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            />
            <span className="text-xl font-bold text-gray-900">Team Tasks AI</span>
          </motion.div>
          <motion.div 
            className="flex items-center space-x-6"
            variants={slideFromRight}
          >
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                Sign up free
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section with parallax effect */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-900 text-white overflow-hidden relative">
        {/* Animated background elements */}
        <motion.div 
          className="absolute inset-0 overflow-hidden opacity-20"
          style={{ y: heroBackgroundY }}
        >
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        </motion.div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-8"
              style={{ y: heroContentY }}
              initial="hidden"
              animate="visible"
              variants={slideFromLeft}
            >
              <motion.h1 
                className="text-5xl font-extrabold tracking-tight leading-tight"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.span 
                  className="block" 
                  variants={slideFromBottom}
                >
                  Transform How
                </motion.span>
                <motion.span 
                  className="block" 
                  variants={slideFromBottom}
                >
                  Your Team Works 
                </motion.span>
                <motion.span 
                  className="block text-indigo-200" 
                  variants={slideFromBottom}
                >
                  Together
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-indigo-100"
                variants={fadeIn}
              >
                Team Tasks AI combines intelligent task management with powerful collaboration tools to help your team achieve more, faster.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  variants={bounceIn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/register" className="block bg-white text-indigo-700 font-medium px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors text-center">
                    Get Started for Free
                  </Link>
                </motion.div>
                <motion.div 
                  variants={bounceIn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a href="#features" className="block border border-white text-white font-medium px-6 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-center">
                    Learn More
                  </a>
                </motion.div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="hidden md:block"
              initial="hidden"
              animate="visible"
              variants={slideFromRight}
            >
              <div className="relative">
                <motion.div 
                  className="absolute inset-0 bg-white bg-opacity-10 blur-xl rounded-3xl transform rotate-3"
                  animate={{ 
                    rotate: [3, 5, 3],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ 
                    duration: 8, 
                    repeat: Infinity, 
                    repeatType: "reverse" 
                  }}
                ></motion.div>
                
                <motion.div 
                  className="relative bg-white rounded-xl shadow-2xl overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <img 
                    src={dashboard_img} 
                    alt="Team Tasks AI Dashboard" 
                    className="w-full"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Animated wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <motion.svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.path
              d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"
              fill="#ffffff"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            ></motion.path>
          </motion.svg>
        </div>
      </section>

      {/* Features Section with improved animations */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={popUp}
          >
            <h2 className="text-3xl font-bold text-gray-900">Powerful Features to Boost Productivity</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Designed to simplify team collaboration and maximize efficiency
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {/* Feature 1 */}
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              variants={slideFromBottom}
            >
              {/* Background gradient animation */}
              <motion.div 
                className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-50 rounded-full opacity-30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.2, 0.3]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                }}
              />
              
              <motion.div 
                className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6 relative z-10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{ 
                  boxShadow: ["0 0 0 rgba(79, 70, 229, 0)", "0 0 20px rgba(79, 70, 229, 0.3)", "0 0 0 rgba(79, 70, 229, 0)"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <Brain className="h-6 w-6 text-indigo-600" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">AI-Powered Organization</h3>
              <p className="text-gray-600 relative z-10">
                Our intelligent system automatically prioritizes and organizes tasks based on your team's workflow and deadlines.
              </p>
            </motion.div>

            {/* Features 2-4 similarly styled */}
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              variants={slideFromBottom}
            >
              <motion.div 
                className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-50 rounded-full opacity-30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.2, 0.3]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: 1
                }}
              />
              
              <motion.div 
                className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6 relative z-10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{ 
                  boxShadow: ["0 0 0 rgba(79, 70, 229, 0)", "0 0 20px rgba(79, 70, 229, 0.3)", "0 0 0 rgba(79, 70, 229, 0)"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5
                }}
              >
                <Users className="h-6 w-6 text-indigo-600" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">Smart Collaboration</h3>
              <p className="text-gray-600 relative z-10">
                Connect team members with the right tasks at the right time, making collaboration seamless and efficient.
              </p>
            </motion.div>

            <motion.div 
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              variants={slideFromBottom}
            >
              <motion.div 
                className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-50 rounded-full opacity-30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.2, 0.3]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: 2
                }}
              />
              
              <motion.div 
                className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6 relative z-10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{ 
                  boxShadow: ["0 0 0 rgba(79, 70, 229, 0)", "0 0 20px rgba(79, 70, 229, 0.3)", "0 0 0 rgba(79, 70, 229, 0)"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 1
                }}
              >
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">Insightful Analytics</h3>
              <p className="text-gray-600 relative z-10">
                Gain valuable insights into team productivity and project progress with comprehensive analytics tools.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              variants={slideFromBottom}
            >
              <motion.div 
                className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-50 rounded-full opacity-30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.2, 0.3]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: 3
                }}
              />
              
              <motion.div 
                className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6 relative z-10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{ 
                  boxShadow: ["0 0 0 rgba(79, 70, 229, 0)", "0 0 20px rgba(79, 70, 229, 0.3)", "0 0 0 rgba(79, 70, 229, 0)"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 1.5
                }}
              >
                <Shield className="h-6 w-6 text-indigo-600" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">Enterprise Security</h3>
              <p className="text-gray-600 relative z-10">
                Protect your team's data with enterprise-grade security features and compliance with industry standards.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold text-gray-900">How Team Tasks AI Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              A simple process to transform your team's productivity
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-12"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div 
              className="text-center"
              variants={slideFromBottom}
            >
              <motion.div 
                className="bg-indigo-600 h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6"
                whileHover={{ scale: 1.1 }}
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              >1</motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Connect Your Team</h3>
              <p className="text-gray-600">
                Invite team members and integrate with your existing tools and workflows in minutes.
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              variants={slideFromBottom}
            >
              <motion.div 
                className="bg-indigo-600 h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6"
                whileHover={{ scale: 1.1 }}
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.3
                }}
              >2</motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes your team's work patterns and optimizes task distribution and prioritization.
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              variants={slideFromBottom}
            >
              <motion.div 
                className="bg-indigo-600 h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6"
                whileHover={{ scale: 1.1 }}
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.6
                }}
              >3</motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Boost Productivity</h3>
              <p className="text-gray-600">
                Watch as your team's efficiency improves with intelligent task management and collaboration.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            <div className="grid md:grid-cols-2">
              <motion.div 
                className="bg-indigo-700 p-12 text-white"
                variants={slideFromLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold mb-6">What Our Customers Say</h2>
                <blockquote className="text-xl italic">
                  "Team Tasks AI has transformed how our team collaborates. We've increased productivity by over 35% since implementing it."
                </blockquote>
                <motion.div 
                  className="mt-6 flex items-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
                    SC
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Sarah Chen</p>
                    <p className="text-indigo-200">Product Manager, TechCorp</p>
                  </div>
                </motion.div>
              </motion.div>
              <motion.div 
                className="p-12"
                variants={slideFromRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Teams Choose Us</h3>
                <motion.ul 
                  className="space-y-4"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.li className="flex" variants={slideFromRight}>
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="ml-3 text-gray-700">Intuitive interface with minimal learning curve</span>
                  </motion.li>
                  <motion.li className="flex" variants={slideFromRight}>
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="ml-3 text-gray-700">Seamless integration with your existing workflow</span>
                  </motion.li>
                  <motion.li className="flex" variants={slideFromRight}>
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="ml-3 text-gray-700">Enterprise-grade security and data protection</span>
                  </motion.li>
                  <motion.li className="flex" variants={slideFromRight}>
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="ml-3 text-gray-700">24/7 customer support and dedicated onboarding</span>
                  </motion.li>
                </motion.ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              No hidden fees. Choose the plan that works for your team.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {/* Starter Plan */}
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              variants={slideFromBottom}
              whileHover={{ y: -10, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 mb-6">Perfect for small teams</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">Free</span>
                <span className="text-gray-500 ml-1">forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Up to 5 team members</span>
                </motion.li>
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Basic task management</span>
                </motion.li>
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Limited AI features</span>
                </motion.li>
              </ul>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/register" className="block w-full py-3 px-4 bg-white border border-indigo-600 text-indigo-600 rounded-lg text-center font-medium hover:bg-indigo-50 transition-colors">
                  Get Started
                </Link>
              </motion.div>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
              className="bg-indigo-600 p-8 rounded-xl shadow-xl text-white transform scale-105"
              variants={slideFromBottom}
              whileHover={{ y: -10, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="inline-block px-3 py-1 rounded-full bg-white text-indigo-600 text-sm font-medium mb-4">
                Most Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-indigo-200 mb-6">For growing teams</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$12</span>
                <span className="text-indigo-200 ml-1">/ user / month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-white mr-2" />
                  <span>Unlimited team members</span>
                </motion.li>
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-white mr-2" />
                  <span>Advanced task management</span>
                </motion.li>
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-white mr-2" />
                  <span>Full AI capabilities</span>
                </motion.li>
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-white mr-2" />
                  <span>Priority support</span>
                </motion.li>
              </ul>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/register" className="block w-full py-3 px-4 bg-white text-indigo-600 rounded-lg text-center font-medium hover:bg-opacity-90 transition-colors">
                  Start Free Trial
                </Link>
              </motion.div>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              variants={slideFromBottom}
              whileHover={{ y: -10, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">For large organizations</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
                <span className="text-gray-500 ml-1">pricing</span>
              </div>
              <ul className="space-y-3 mb-8">
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Everything in Pro plan</span>
                </motion.li>
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Dedicated account manager</span>
                </motion.li>
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Custom integrations</span>
                </motion.li>
                <motion.li 
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Advanced security features</span>
                </motion.li>
              </ul>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/contact" className="block w-full py-3 px-4 bg-white border border-indigo-600 text-indigo-600 rounded-lg text-center font-medium hover:bg-indigo-50 transition-colors">
                  Contact Sales
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Seamless Integrations</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with the tools your team already uses and loves
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            {/* Integration logos would go here - using placeholders */}
            <div className="h-16 w-32 bg-white rounded-lg shadow-sm flex items-center justify-center p-4">
              <div className="text-gray-400 font-medium">Slack</div>
            </div>
            <div className="h-16 w-32 bg-white rounded-lg shadow-sm flex items-center justify-center p-4">
              <div className="text-gray-400 font-medium">GitHub</div>
            </div>
            <div className="h-16 w-32 bg-white rounded-lg shadow-sm flex items-center justify-center p-4">
              <div className="text-gray-400 font-medium">Jira</div>
            </div>
            <div className="h-16 w-32 bg-white rounded-lg shadow-sm flex items-center justify-center p-4">
              <div className="text-gray-400 font-medium">Google</div>
            </div>
            <div className="h-16 w-32 bg-white rounded-lg shadow-sm flex items-center justify-center p-4">
              <div className="text-gray-400 font-medium">Microsoft</div>
            </div>
            <div className="h-16 w-32 bg-white rounded-lg shadow-sm flex items-center justify-center p-4">
              <div className="text-gray-400 font-medium">Asana</div>
            </div>
            <div className="h-16 w-32 bg-white rounded-lg shadow-sm flex items-center justify-center p-4">
              <div className="text-gray-400 font-medium">Trello</div>
            </div>
            <div className="h-16 w-32 bg-white rounded-lg shadow-sm flex items-center justify-center p-4">
              <div className="text-gray-400 font-medium">Notion</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-900 py-16 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform how your team works?</h2>
          <p className="text-xl text-indigo-200 mb-8 max-w-3xl mx-auto">
            Join thousands of teams already using Team Tasks AI to boost productivity and streamline collaboration.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register" className="bg-white text-indigo-700 font-medium px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link to="/demo" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors">
              Request a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 pt-16 pb-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-600 hover:text-gray-900">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Integrations</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Documentation</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Guides</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">API Reference</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">About</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Careers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Partners</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Terms</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Team Tasks AI Logo" className="h-8 w-auto" />
              <span className="text-gray-500 text-sm">© 2025 Team Tasks AI. All rights reserved.</span>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12c2.049 0 3.819.757 5.105 1.974a1.417 1.417 0 01-.219 1.852 5.09 5.09 0 001.62 1.673 1.417 1.417 0 01.603 1.85 5.135 5.135 0 001.498 1.078 1.417 1.417 0 01.921 1.85 5.058 5.058 0 001.469.923 1.417 1.417 0 011.046 1.851c.135.387.225.782.225 1.185V12c0 5.516-4.515 10-10.007 10z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.662 9.157 8.438 9.878v-6.987h-2.54a.75.75 0 01-.75-.75v-3.201a.75.75 0 01.75-.75h2.54v-2.012c0-2.506 1.497-3.89 3.777-3.89a12.47 12.47 0 012.233.117.75.75 0 01.75.75v2.107a.75.75 0 01-.75.75h-1.331c-1.205 0-1.433.57-1.433 1.409v2.012h2.765a.75.75 0 01-.75.75v3.201a.75.75 0 01.75.75h-2.765v6.987C18.338 21.157 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;