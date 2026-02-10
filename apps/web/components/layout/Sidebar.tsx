'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Hash, Bell, Mail, User, Bookmark, Users, Settings, Wallet, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Hash },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Messages', href: '/messages', icon: Mail },
    { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { label: 'Groups', href: '/groups', icon: Users },
    { label: 'Wallet', href: '/wallet', icon: Wallet },
    { label: 'Profile', href: user ? `/${user.username}` : '/login', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <Link href="/" className="logo-link">
          <div className="brand-container">
            <Image src="/logo.png" alt="1U Logo" width={32} height={32} className="brand-icon" />
          </div>
        </Link>

        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.label} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                <span className="icon-wrapper"><Icon size={26} strokeWidth={isActive ? 2.5 : 2} /></span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button className="btn-primary btn-large btn-post">
          Post
        </button>
      </div>

      {isAuthenticated && user ? (
        <div className="user-mini-profile" onClick={logout}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="avatar" />
          ) : (
            <div className="avatar-placeholder-mini">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="user-info">
            <p className="user-name">{user.displayName}</p>
            <p className="user-handle">@{user.username}</p>
          </div>
          <MoreHorizontal size={18} className="more-icon" />
        </div>
      ) : (
        <Link href="/login" className="btn-primary btn-login">
          Log in
        </Link>
      )}

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
        .brand-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          margin-bottom: 1rem;
          cursor: pointer;
          transition: background 0.2s;
          margin-left: 0.5rem;
        }
        .brand-container:hover {
          background: hsla(210, 100%, 60%, 0.1);
        }
        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-full);
          transition: var(--transition-normal);
          font-size: 1.2rem;
          font-weight: 400;
          color: var(--color-text-main);
        }
        .nav-item:hover {
          background: var(--color-bg-card);
        }
        .nav-item.active {
          font-weight: 700;
        }
        .btn-post {
          margin-top: 1.5rem;
          width: 90%;
          font-size: 1.1rem;
          padding: 1rem;
        }
        .btn-login {
          display: block;
          text-align: center;
          margin-bottom: 1rem;
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
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar-placeholder-mini {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .user-info {
          flex: 1;
          min-width: 0;
        }
        .user-info p {
          line-height: 1.2;
        }
        .user-name {
          font-weight: 700;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-handle {
          color: var(--color-text-muted);
          font-size: 0.85rem;
        }
      `}</style>
    </aside>
  );
}
