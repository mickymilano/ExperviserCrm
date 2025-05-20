import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { MailIcon, Settings, Edit, Server, Inbox, Send } from 'lucide-react';

export default function EmailPage() {
  const { t } = useTranslation();
  
  const emailModules = [
    {
      id: 'inbox',
      title: t('email.inbox'),
      description: t('email.inboxDescription'),
      icon: <Inbox className="h-8 w-8" />,
      href: '/emails/inbox',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'compose',
      title: t('email.compose'),
      description: t('email.composeDescription'),
      icon: <Send className="h-8 w-8" />,
      href: '/emails/compose',
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'accounts',
      title: t('email.accounts'),
      description: t('email.accountsDescription'),
      icon: <Server className="h-8 w-8" />,
      href: '/emails/accounts',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'signatures',
      title: t('email.signatures'),
      description: t('email.signaturesDescription'),
      icon: <Edit className="h-8 w-8" />,
      href: '/emails/signatures',
      color: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'settings',
      title: t('email.settings'),
      description: t('email.settingsDescription'),
      icon: <Settings className="h-8 w-8" />,
      href: '/emails/settings',
      color: 'bg-gray-100 text-gray-700'
    }
  ];

  return (
    <>
      <Helmet>
        <title>{t('email.title')} | Experviser CRM</title>
        <meta name="description" content={t('email.pageDescription')} />
      </Helmet>
      
      <div className="container mx-auto p-6">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center gap-2">
            <MailIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('email.title')}</h1>
          </div>
          
          <p className="text-lg text-muted-foreground max-w-3xl">
            {t('email.subtitle')}
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {emailModules.map((module) => (
              <Link key={module.id} href={module.href}>
                <a className="block h-full">
                  <Card className="h-full transition-all hover:shadow-md cursor-pointer">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-full ${module.color} flex items-center justify-center mb-2`}>
                        {module.icon}
                      </div>
                      <CardTitle>{module.title}</CardTitle>
                      <CardDescription>
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <p className="text-sm text-primary">
                        {t('common.openModule')} →
                      </p>
                    </CardFooter>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}