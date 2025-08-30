'use client';

import React from 'react';
import { motion } from 'motion/react';

export function ConstellationBackground() {
  // Generate star data with different properties
  const generateStars = (count: number, type: 'small' | 'medium' | 'large' | 'cosmic') => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: type === 'small' ? 1 : type === 'medium' ? 1.5 : type === 'large' ? 2 : 3,
      brightness: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.5 + 0.1,
      direction: Math.random() * 360,
      pulseDuration: type === 'cosmic' ? 4 + Math.random() * 3 : 2 + Math.random() * 3,
      delay: Math.random() * 4,
      type
    }));
  };

  const smallStars = generateStars(60, 'small');
  const mediumStars = generateStars(25, 'medium');
  const largeStars = generateStars(12, 'large');
  const cosmicStars = generateStars(8, 'cosmic');

  // Floating particles with orbital motion
  const generateOrbitals = (count: number) => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      centerX: 20 + Math.random() * 60,
      centerY: 20 + Math.random() * 60,
      radius: 50 + Math.random() * 100,
      speed: 0.3 + Math.random() * 0.7,
      startAngle: Math.random() * 360,
      size: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.4,
      color: Math.random() > 0.7 ? '#FFD700' : '#C0C0C0'
    }));
  };

  const orbitals = generateOrbitals(15);

  // Shooting stars
  const generateShootingStars = (count: number) => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      startX: Math.random() * 120 - 10,
      startY: Math.random() * 120 - 10,
      endX: Math.random() * 120 - 10,
      endY: Math.random() * 120 - 10,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 15,
      size: 1 + Math.random()
    }));
  };

  const shootingStars = generateShootingStars(6);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Layer 1: Small twinkling stars */}
      <div className="absolute inset-0 opacity-15">
        {smallStars.map((star) => (
          <motion.div
            key={`small-${star.id}`}
            className="absolute bg-white rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
            animate={{
              opacity: [star.brightness * 0.3, star.brightness, star.brightness * 0.3],
              scale: [0.8, 1.3, 0.8],
              x: [0, Math.sin(star.direction) * 5, 0],
              y: [0, Math.cos(star.direction) * 3, 0],
            }}
            transition={{
              duration: star.pulseDuration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Layer 2: Medium stars with gentle drift */}
      <div className="absolute inset-0 opacity-25">
        {mediumStars.map((star) => (
          <motion.div
            key={`medium-${star.id}`}
            className="absolute bg-white rounded-full shadow-sm"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              filter: 'blur(0.5px)',
            }}
            animate={{
              opacity: [star.brightness * 0.2, star.brightness * 0.8, star.brightness * 0.2],
              scale: [1, 1.4, 1],
              x: [0, Math.sin(star.direction) * 8, Math.sin(star.direction + 90) * 4, 0],
              y: [0, Math.cos(star.direction) * 6, Math.cos(star.direction + 90) * 3, 0],
            }}
            transition={{
              duration: star.pulseDuration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Layer 3: Large stars with golden glow */}
      <div className="absolute inset-0 opacity-35">
        {largeStars.map((star) => (
          <motion.div
            key={`large-${star.id}`}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: Math.random() > 0.6 ? '#FFD700' : '#FFFFFF',
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 215, 0, 0.3)`,
              filter: 'blur(0.5px)',
            }}
            animate={{
              opacity: [star.brightness * 0.4, star.brightness, star.brightness * 0.4],
              scale: [1, 1.6, 1],
              x: [0, Math.sin(star.direction) * 12, Math.sin(star.direction + 180) * 6, 0],
              y: [0, Math.cos(star.direction) * 10, Math.cos(star.direction + 180) * 5, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: star.pulseDuration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Layer 4: Cosmic dust particles */}
      <div className="absolute inset-0 opacity-20">
        {cosmicStars.map((star) => (
          <motion.div
            key={`cosmic-${star.id}`}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: 'radial-gradient(circle, #FFD700 0%, rgba(255, 215, 0, 0.3) 70%, transparent 100%)',
              filter: 'blur(1px)',
            }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              scale: [0.5, 2, 0.5],
              x: [0, Math.sin(star.direction) * 20, Math.sin(star.direction + 120) * 15, Math.sin(star.direction + 240) * 10, 0],
              y: [0, Math.cos(star.direction) * 15, Math.cos(star.direction + 120) * 12, Math.cos(star.direction + 240) * 8, 0],
            }}
            transition={{
              duration: star.pulseDuration * 1.5,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Layer 5: Orbital particles */}
      <div className="absolute inset-0 opacity-10">
        {orbitals.map((orbital) => (
          <motion.div
            key={`orbital-${orbital.id}`}
            className="absolute rounded-full"
            style={{
              width: `${orbital.size}px`,
              height: `${orbital.size}px`,
              background: orbital.color,
              boxShadow: `0 0 ${orbital.size * 2}px ${orbital.color}`,
            }}
            animate={{
              x: [
                orbital.centerX + orbital.radius * Math.cos((orbital.startAngle * Math.PI) / 180),
                orbital.centerX + orbital.radius * Math.cos(((orbital.startAngle + 90) * Math.PI) / 180),
                orbital.centerX + orbital.radius * Math.cos(((orbital.startAngle + 180) * Math.PI) / 180),
                orbital.centerX + orbital.radius * Math.cos(((orbital.startAngle + 270) * Math.PI) / 180),
                orbital.centerX + orbital.radius * Math.cos((orbital.startAngle * Math.PI) / 180),
              ],
              y: [
                orbital.centerY + orbital.radius * Math.sin((orbital.startAngle * Math.PI) / 180),
                orbital.centerY + orbital.radius * Math.sin(((orbital.startAngle + 90) * Math.PI) / 180),
                orbital.centerY + orbital.radius * Math.sin(((orbital.startAngle + 180) * Math.PI) / 180),
                orbital.centerY + orbital.radius * Math.sin(((orbital.startAngle + 270) * Math.PI) / 180),
                orbital.centerY + orbital.radius * Math.sin((orbital.startAngle * Math.PI) / 180),
              ],
              opacity: [orbital.opacity * 0.3, orbital.opacity, orbital.opacity * 0.3],
            }}
            transition={{
              duration: 15 + orbital.speed * 10,
              repeat: Infinity,
              ease: "linear",
              delay: orbital.id * 0.5,
            }}
          />
        ))}
      </div>

      {/* Layer 6: Shooting stars */}
      <div className="absolute inset-0 opacity-40">
        {shootingStars.map((star) => (
          <motion.div
            key={`shooting-${star.id}`}
            className="absolute"
            style={{
              left: `${star.startX}%`,
              top: `${star.startY}%`,
            }}
            animate={{
              x: [`0%`, `${star.endX - star.startX}%`],
              y: [`0%`, `${star.endY - star.startY}%`],
              opacity: [0, 1, 0.8, 0],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeOut",
              repeatDelay: 10 + Math.random() * 10,
            }}
          >
            <div
              className="w-1 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full"
              style={{
                width: `${20 + star.size * 10}px`,
                height: `${star.size}px`,
                boxShadow: `0 0 ${star.size * 3}px rgba(255, 255, 255, 0.6)`,
                filter: 'blur(0.5px)',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Layer 7: Nebula clouds */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`nebula-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
              width: `${50 + Math.random() * 100}px`,
              height: `${50 + Math.random() * 100}px`,
              background: `radial-gradient(ellipse, 
                rgba(255, 215, 0, 0.1) 0%, 
                rgba(192, 192, 192, 0.05) 30%, 
                rgba(25, 25, 112, 0.03) 60%, 
                transparent 100%)`,
              filter: 'blur(3px)',
            }}
            animate={{
              scale: [1, 1.2, 0.9, 1],
              opacity: [0.3, 0.6, 0.4, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20 + Math.random() * 15,
              repeat: Infinity,
              delay: i * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Layer 8: Particle trails */}
      <div className="absolute inset-0 opacity-8">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`trail-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            {[...Array(5)].map((_, j) => (
              <motion.div
                key={j}
                className="absolute w-0.5 h-0.5 bg-white rounded-full"
                style={{
                  left: `${j * 3}px`,
                  top: `${j * 2}px`,
                }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1, 0.5],
                  x: [0, Math.sin(i * 30) * 15, 0],
                  y: [0, Math.cos(i * 30) * 10, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: j * 0.3 + i * 0.5,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* Layer 9: Interactive cosmic particles that respond to scroll */}
      <div className="absolute inset-0 opacity-15">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`interactive-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random()}px`,
              height: `${1 + Math.random()}px`,
              background: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF',
              boxShadow: `0 0 ${2 + Math.random() * 3}px rgba(255, 215, 0, 0.4)`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.5, 0.8],
              x: [0, Math.sin(i * 45) * 10, Math.sin(i * 90) * 15, 0],
              y: [0, Math.cos(i * 45) * 8, Math.cos(i * 90) * 12, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8 + Math.random() * 5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            whileHover={{
              scale: 2,
              opacity: 1,
              transition: { duration: 0.3 }
            }}
          />
        ))}
      </div>
    </div>
  );
}
