'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/',         label: 'Dashboard', icon: '📊' },
  { href: '/tracker',  label: 'Track',     icon: '✏️' },
  { href: '/insights', label: 'Insights',  icon: '🤖' },
  { href: '/goals',    label: 'Goals',     icon: '🎯' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 200,
          height: '70px',
          background: scrolled
            ? 'hsla(222, 28%, 7%, 0.92)'
            : 'hsla(222, 28%, 7%, 0.75)',
          backdropFilter: 'blur(20px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
          borderBottom: scrolled
            ? '1px solid hsl(220, 18%, 18%)'
            : '1px solid hsla(220, 18%, 20%, 0.5)',
          transition: 'background 250ms ease, border-color 250ms ease',
        }}
      >
        <div
          style={{
            maxWidth: '1300px',
            margin: '0 auto',
            padding: '0 2rem',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
          }}
        >
          {/* Logo */}
          <Link href="/" id="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            <span style={{
              width: '34px', height: '34px',
              background: 'linear-gradient(135deg, hsl(152,62%,40%), hsl(174,70%,38%))',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
              boxShadow: '0 0 16px hsla(152,62%,50%,0.4)',
            }}>🌿</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.03em', color: 'hsl(210,30%,96%)' }}>
              Carbon<span style={{
                background: 'linear-gradient(125deg, hsl(152,68%,65%), hsl(174,70%,48%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Wise</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  id={`nav-${link.label.toLowerCase()}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0.5rem 1.1rem',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'hsl(152,68%,65%)' : 'hsl(215,16%,60%)',
                    background: isActive ? 'hsla(152,52%,18%,0.6)' : 'transparent',
                    border: isActive ? '1px solid hsla(152,52%,42%,0.35)' : '1px solid transparent',
                    transition: 'all 200ms ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = 'hsl(210,30%,92%)';
                      (e.currentTarget as HTMLElement).style.background = 'hsla(220,20%,20%,0.7)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = 'hsl(215,16%,60%)';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '0.95rem' }}>{link.icon}</span>
                  <span className="hide-mobile">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <Link
              href="/tracker"
              id="nav-log-activity"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.52rem 1.15rem',
                background: 'linear-gradient(135deg, hsl(152,62%,50%), hsl(174,70%,48%))',
                color: 'hsl(222,28%,6%)',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.845rem',
                letterSpacing: '-0.01em',
                textDecoration: 'none',
                boxShadow: '0 0 20px hsla(152,62%,50%,0.3)',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px) scale(1.03)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px hsla(152,62%,50%,0.5)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px hsla(152,62%,50%,0.3)';
              }}
            >
              <span>+</span> Log Activity
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              id="nav-menu-toggle"
              aria-label="Toggle menu"
              style={{
                display: 'none',
                background: 'var(--bg-card-2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.5rem',
                fontSize: '1rem',
                lineHeight: 1,
                transition: 'all 200ms ease',
              }}
              className="mobile-toggle"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            id="nav-mobile-menu"
            style={{
              background: 'hsla(222,28%,9%,0.98)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid var(--border)',
              padding: '0.75rem 1.25rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    color: isActive ? 'hsl(152,68%,65%)' : 'hsl(215,16%,65%)',
                    background: isActive ? 'hsla(152,52%,18%,0.5)' : 'transparent',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                  }}
                >
                  <span>{link.icon}</span>{link.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <style jsx global>{`
        @media (max-width: 640px) {
          .mobile-toggle { display: flex !important; }
        }
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
