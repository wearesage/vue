interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export function useParticleSystem(maxParticles = 500) {
  const particles: Particle[] = [];

  function createParticle(
    x: number,
    y: number,
    options: Partial<Particle> = {}
  ) {
    if (particles.length >= maxParticles) return;

    const particle: Particle = {
      x,
      y,
      vx: options.vx ?? (Math.random() - 0.5) * 2,
      vy: options.vy ?? (Math.random() - 0.5) * 2 - 1, // Slight upward bias
      radius: options.radius ?? Math.random() * 4 + 1,
      color: options.color ?? `hsla(${Math.random() * 360}, 80%, 60%, 0.8)`,
      life: options.life ?? 1.0,
      maxLife: options.maxLife ?? 1.0,
    };

    particles.push(particle);
    return particle;
  }

  interface ParticleGroupOptions extends Partial<Particle> {
    x: number;
    y: number;
    count: number;
  }

  function createParticleGroup(options: ParticleGroupOptions) {
    const { x, y, count, ...rest } = options;
    for (let i = 0; i < count; i++) {
      createParticle(x, y, rest);
    }
  }

  let lastFrameTime = performance.now();

  function update(now: DOMHighResTimeStamp) {
    const deltaTime = (now - lastFrameTime) / 1000;
    lastFrameTime = now;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.life -= deltaTime / p.maxLife;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function render(drawFunc: (props: any) => void) {
    for (const p of particles) {
      const alpha = p.life;
      const color = p.color.includes("hsla")
        ? p.color
        : p.color.replace("hsl", "hsla").replace(")", `, ${alpha})`);

      drawFunc({
        x: p.x,
        y: p.y,
        radius: p.radius * (0.5 + p.life * 0.5),
        fillStyle: color,
      });
    }
  }

  function getCount() {
    return particles.length;
  }

  function clear() {
    particles.length = 0;
  }

  return {
    particles,
    createParticle,
    createParticleGroup,
    update,
    render,
    getCount,
    clear,
  };
}
