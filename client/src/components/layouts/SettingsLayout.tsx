import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { 
  Settings, 
  Users, 
  Database, 
  Mail, 
  Workflow, 
  Import, 
  FileText, 
  Globe,
  Cpu
} from 'lucide-react';

interface SettingsLayoutProps {
  children: ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const { t } = useTranslation();
  const [location] = useLocation();

  const navItems = [
    { 
      label: t('settings.general.title'), 
      href: '/settings/general', 
      icon: <Settings className="h-4 w-4 mr-2" /> 
    },
    { 
      label: t('settings.users.title'), 
      href: '/settings/users', 
      icon: <Users className="h-4 w-4 mr-2" /> 
    },
    { 
      label: t('settings.database.title'), 
      href: '/settings/database', 
      icon: <Database className="h-4 w-4 mr-2" /> 
    },
    { 
      label: t('settings.email.title'), 
      href: '/settings/email', 
      icon: <Mail className="h-4 w-4 mr-2" /> 
    },
    { 
      label: t('settings.workflow.title'), 
      href: '/settings/workflow', 
      icon: <Workflow className="h-4 w-4 mr-2" /> 
    },
    { 
      label: t('settings.importExport.title'), 
      href: '/settings/import-export', 
      icon: <Import className="h-4 w-4 mr-2" /> 
    },
    { 
      label: t('settings.templates.title'), 
      href: '/settings/templates', 
      icon: <FileText className="h-4 w-4 mr-2" /> 
    },
    { 
      label: t('settings.localization.title'), 
      href: '/settings/localization', 
      icon: <Globe className="h-4 w-4 mr-2" /> 
    },
    { 
      label: t('settings.notion.title'), 
      href: '/settings/notion-integration', 
      icon: <Cpu className="h-4 w-4 mr-2" /> 
    }
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">{t('settings.title')}</h2>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}