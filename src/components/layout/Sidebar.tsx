import Link from 'next/link';

export default function Sidebar() {
    const navItems = [
        { label: 'Home', href: '/', icon: <HomeIcon /> },
        { label: 'Explore', href: '/explore', icon: <HashIcon /> },
        { label: 'Notifications', href: '/notifications', icon: <BellIcon /> },
        { label: 'Messages', href: '/messages', icon: <MailIcon /> },
        { label: 'Profile', href: '/profile', icon: <UserIcon /> },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                <Link href="/" className="logo-link">
                    <h1 className="brand-logo">1ummah</h1>
                </Link>

                <nav className="nav-menu">
                    {navItems.map((item) => (
                        <Link key={item.label} href={item.href} className="nav-item">
                            <span className="icon-wrapper">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <button className="btn-primary btn-large btn-post">
                    Post
                </button>
            </div>

            <div className="user-mini-profile">
                <div className="avatar-placeholder" />
                <div className="user-info">
                    <p className="user-name">User Name</p>
                    <p className="user-handle">@username</p>
                </div>
            </div>

            <style jsx>{`
        .sidebar {
          height: 100vh;
          width: 275px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: sticky;
          top: 0;
          padding: 1rem 1rem 1rem 2rem;
          border-right: 1px solid var(--color-border);
        }
        
        .brand-logo {
          font-size: 1.8rem;
          padding: 0.5rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          cursor: pointer;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-full);
          transition: var(--transition-normal);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-text-main);
        }

        .nav-item:hover {
          background: var(--color-bg-card);
        }

        .btn-post {
          margin-top: 2rem;
          width: 90%;
          font-size: 1.1rem;
          padding: 1rem;
        }

        .user-mini-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: var(--transition-normal);
        }
        
        .user-mini-profile:hover {
          background: var(--color-bg-card);
        }

        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-border);
        }

        .user-info p {
          line-height: 1.2;
        }

        .user-handle {
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }
      `}</style>
        </aside>
    );
}

// Simple Inline Icons for MVP
const HomeIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" /></svg>
);
const HashIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>
);
const BellIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
);
const MailIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);
const UserIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
