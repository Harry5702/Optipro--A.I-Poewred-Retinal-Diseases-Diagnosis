import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQuoteLeft, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { ThemeContext } from '../App';
import './TestimonialSlider.css';

const testimonials = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    role: 'Ophthalmologist',
    text: 'OptiPro has transformed how we diagnose retinal conditions. The AI detection is remarkably accurate and has helped us catch diseases in their early stages when they\'re most treatable.',
    image: 'https://randomuser.me/api/portraits/women/32.jpg',
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    role: 'Retina Specialist',
    text: 'The heatmap visualization feature has been invaluable in my practice. It allows me to clearly explain to patients where the issues are and how we plan to address them.',
    image: 'https://randomuser.me/api/portraits/men/11.jpg',
  },
  {
    id: 3,
    name: 'Dr. Emily Rodriguez',
    role: 'Clinical Researcher',
    text: 'We\'ve integrated OptiPro into our research workflow, and it\'s significantly improved our ability to classify and document retinal pathologies consistently across our studies.',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

const TestimonialSlider = () => {
  const { darkMode } = useContext(ThemeContext);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(null);
  
  // Auto-slide functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      setDirection('right');
      setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [current]);
  
  const handlePrev = () => {
    setDirection('left');
    setCurrent((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setDirection('right');
    setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };
  
  const variants = {
    enter: (direction) => ({
      x: direction === 'right' ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction === 'right' ? -1000 : 1000,
      opacity: 0,
    }),
  };
  
  return (
    <div className={`testimonial-slider ${darkMode ? 'dark' : 'light'}`}>
      <div className="testimonial-container">
        <FaQuoteLeft className="quote-icon" />
        
        <div className="testimonial-content">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="testimonial"
            >
              <div className="testimonial-image">
                <img src={testimonials[current].image} alt={testimonials[current].name} />
              </div>
              <div className="testimonial-text">
                <p>{testimonials[current].text}</p>
                <div className="testimonial-author">
                  <h4>{testimonials[current].name}</h4>
                  <span>{testimonials[current].role}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="testimonial-controls">
          <button className="control-btn" onClick={handlePrev}>
            <FaArrowLeft />
          </button>
          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === current ? 'active' : ''}`}
                onClick={() => {
                  setDirection(index > current ? 'right' : 'left');
                  setCurrent(index);
                }}
              />
            ))}
          </div>
          <button className="control-btn" onClick={handleNext}>
            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestimonialSlider; 