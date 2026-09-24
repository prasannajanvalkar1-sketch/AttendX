import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  CalendarCheck, 
  CalendarDays, 
  Upload, 
  Settings as SettingsIcon,
  LogOut,
  Info,
  Clock,
  History,
  Calculator
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/daily', icon: CalendarCheck, label: 'Daily Attendance' },
  { to: '/timetable', icon: Clock, label: 'Timetable' },
  { to: '/plan-leave', icon: CalendarDays, label: 'Plan Leave' },
  { to: '/upload', icon: Upload, label: 'Upload Sheet' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/calculator', icon: Calculator, label: 'Calculator' },
];

const bottomNavItems = [
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  { to: '/about', icon: Info, label: 'About' },
];

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-black text-primary tracking-tight">AttendX</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        <button
          onClick={() => signOut()}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
