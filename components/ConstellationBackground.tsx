'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';

export function ConstellationBackground() {
  // Seeded random number generator for consistent star positions
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Helper function to format numbers consistently
  const formatNumber = (num: number, precision: number = 4) => {
    return Number(num.toFixed(precision));
  };

  // Generate star data with different properties
  const generateStars = (count: number, type: 'small' | 'medium' | 'large' | 'cosmic') => {
    return [...Array(count)].map((_, i) => {
      const seed = i * 1000 + (type === 'small' ? 1 : type === 'medium' ? 2 : type === 'large' ? 3 : 4);
      const x = seededRandom(seed) * 100;
      const y = seededRandom(seed + 1) * 100;
      const brightness = seededRandom(seed + 2) * 0.8 + 0.2;
      const speed = seededRandom(seed + 3) * 0.5 + 0.1;
      const direction = seededRandom(seed + 4) * 360;
      const pulseDuration = type === 'cosmic' ? 4 + seededRandom(seed + 5) * 3 : 2 + seededRandom(seed + 5) * 3;
      const delay = seededRandom(seed + 6) * 4;
      
      return {
        id: i,
        x: formatNumber(x, 4),
        y: formatNumber(y, 4),
        size: type === 'small' ? 1 : type === 'medium' ? 1.5 : type === 'large' ? 2 : 3,
        brightness: formatNumber(brightness, 4),
        speed: formatNumber(speed, 4),
        direction: formatNumber(direction, 4),
        pulseDuration: formatNumber(pulseDuration, 4),
        delay: formatNumber(delay, 4),
        type
      };
    });
  };

  // Use useMemo to prevent regeneration on every render
  const smallStars = useMemo(() => generateStars(60, 'small'), []);
  const mediumStars = useMemo(() => generateStars(25, 'medium'), []);
  const largeStars = useMemo(() => generateStars(12, 'large'), []);
  const cosmicStars = useMemo(() => generateStars(8, 'cosmic'), []);

  // Floating particles with orbital motion
  const generateOrbitals = (count: number) => {
    return [...Array(count)].map((_, i) => {
      const seed = i * 2000 + 1000;
      const centerX = 20 + seededRandom(seed) * 60;
      const centerY = 20 + seededRandom(seed + 1) * 60;
      const radius = 50 + seededRandom(seed + 2) * 100;
      const speed = 0.3 + seededRandom(seed + 3) * 0.7;
      const startAngle = seededRandom(seed + 4) * 360;
      const size = 1 + seededRandom(seed + 5) * 2;
      const opacity = 0.3 + seededRandom(seed + 6) * 0.4;
      const color = seededRandom(seed + 7) > 0.7 ? '#FFD700' : '#C0C0C0';
      
      return {
        id: i,
        centerX: formatNumber(centerX, 4),
        centerY: formatNumber(centerY, 4),
        radius: formatNumber(radius, 4),
        speed: formatNumber(speed, 4),
        startAngle: formatNumber(startAngle, 4),
        size: formatNumber(size, 4),
        opacity: formatNumber(opacity, 4),
        color
      };
    });
  };

  const orbitals = useMemo(() => generateOrbitals(15), []);

  // Shooting stars
  const generateShootingStars = (count: number) => {
    return [...Array(count)].map((_, i) => {
      const seed = i * 3000 + 2000;
      const startX = seededRandom(seed) * 120 - 10;
      const startY = seededRandom(seed + 1) * 120 - 10;
      const endX = seededRandom(seed + 2) * 120 - 10;
      const endY = seededRandom(seed + 3) * 120 - 10;
      const duration = 2 + seededRandom(seed + 4) * 3;
      const delay = seededRandom(seed + 5) * 15;
      const size = 1 + seededRandom(seed + 6);
      
      return {
        id: i,
        startX: formatNumber(startX, 4),
        startY: formatNumber(startY, 4),
        endX: formatNumber(endX, 4),
        endY: formatNumber(endY, 4),
        duration: formatNumber(duration, 4),
        delay: formatNumber(delay, 4),
        size: formatNumber(size, 4)
      };
    });
  };

  const shootingStars = useMemo(() => generateShootingStars(6), []);

  // Pre-calculate nebula data
  const nebulaData = useMemo(() => {
    return [...Array(8)].map((_, i) => {
      const seed = i * 1000 + 300;
      const x = seededRandom(seed) * 80 + 10;
      const y = seededRandom(seed + 1) * 80 + 10;
      const width = 50 + seededRandom(seed + 2) * 100;
      const height = 50 + seededRandom(seed + 3) * 100;
      const duration = 20 + seededRandom(seed + 4) * 15;
      
      return {
        id: i,
        x: formatNumber(x, 4),
        y: formatNumber(y, 4),
        width: formatNumber(width, 4),
        height: formatNumber(height, 4),
        duration: formatNumber(duration, 4)
      };
    });
  }, []);

  // Pre-calculate trail data
  const trailData = useMemo(() => {
    return [...Array(12)].map((_, i) => {
      const seed = i * 1000 + 400;
      const x = seededRandom(seed) * 100;
      const y = seededRandom(seed + 1) * 100;
      const duration = 3 + seededRandom(seed + 2) * 2;
      
      return {
        id: i,
        x: formatNumber(x, 4),
        y: formatNumber(y, 4),
        duration: formatNumber(duration, 4)
      };
    });
  }, []);

  // Pre-calculate interactive particle data
  const interactiveData = useMemo(() => {
    return [...Array(20)].map((_, i) => {
      const seed = i * 1000 + 500;
      const x = seededRandom(seed) * 100;
      const y = seededRandom(seed + 1) * 100;
      const size = 1 + seededRandom(seed + 2);
      const color = seededRandom(seed + 3) > 0.5 ? '#FFD700' : '#FFFFFF';
      const shadowSize = 2 + seededRandom(seed + 4) * 3;
      const duration = 8 + seededRandom(seed + 5) * 5;
      
      return {
        id: i,
        x: formatNumber(x, 4),
        y: formatNumber(y, 4),
        size: formatNumber(size, 4),
        color,
        shadowSize: formatNumber(shadowSize, 4),
        duration: formatNumber(duration, 4)
      };
    });
  }, []);

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
        {largeStars.map((star) => {
          const isGolden = seededRandom(star.id * 1000 + 100) > 0.6;
          return (
            <motion.div
              key={`large-${star.id}`}
              className="absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                background: isGolden ? '#FFD700' : '#FFFFFF',
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
          );
        })}
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
              repeatDelay: 10 + seededRandom(star.id * 1000 + 200) * 10,
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
        {nebulaData.map((nebula) => (
          <motion.div
            key={`nebula-${nebula.id}`}
            className="absolute rounded-full"
            style={{
              left: `${nebula.x}%`,
              top: `${nebula.y}%`,
              width: `${nebula.width}px`,
              height: `${nebula.height}px`,
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
              duration: nebula.duration,
              repeat: Infinity,
              delay: nebula.id * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Layer 8: Particle trails */}
      <div className="absolute inset-0 opacity-8">
        {trailData.map((trail) => (
          <motion.div
            key={`trail-${trail.id}`}
            className="absolute"
            style={{
              left: `${trail.x}%`,
              top: `${trail.y}%`,
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
                  x: [0, Math.sin(trail.id * 30) * 15, 0],
                  y: [0, Math.cos(trail.id * 30) * 10, 0],
                }}
                transition={{
                  duration: trail.duration,
                  repeat: Infinity,
                  delay: j * 0.3 + trail.id * 0.5,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* Layer 9: Interactive cosmic particles that respond to scroll */}
      <div className="absolute inset-0 opacity-15">
        {interactiveData.map((particle) => (
          <motion.div
            key={`interactive-${particle.id}`}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              boxShadow: `0 0 ${particle.shadowSize}px rgba(255, 215, 0, 0.4)`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.5, 0.8],
              x: [0, Math.sin(particle.id * 45) * 10, Math.sin(particle.id * 90) * 15, 0],
              y: [0, Math.cos(particle.id * 45) * 8, Math.cos(particle.id * 90) * 12, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.id * 0.2,
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
