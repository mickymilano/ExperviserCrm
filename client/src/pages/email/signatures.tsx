import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailSignaturesList from '@/components/email/EmailSignaturesList';
import { Home, Mail, Edit } from 'lucide-react';

export default function EmailSignaturesPage() {
  const { t } = useTranslation();
  
  return (
    <>
      <Helmet>
        <title>{t('emailSignatures.pageTitle')} | Experviser CRM</title>
        <meta name="description" content={t('emailSignatures.pageDescription')} />
      </Helmet>
      
      <div className="container mx-auto p-4 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4 mr-1" />
                {t('common.home')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/email">
                <Mail className="h-4 w-4 mr-1" />
                {t('email.title')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/email/signatures" className="flex items-center">
                <Edit className="h-4 w-4 mr-1" />
                {t('emailSignatures.title')}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="grid gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('emailSignatures.title')}</h1>
            <p className="text-muted-foreground">
              {t('emailSignatures.description')}
            </p>
          </div>
          
          <Tabs defaultValue="personal">
            <TabsList className="mb-4">
              <TabsTrigger value="personal">
                {t('emailSignatures.personalTab')}
              </TabsTrigger>
              <TabsTrigger value="team" disabled>
                {t('emailSignatures.teamTab')} 
                <span className="ml-2 text-xs bg-muted px-1 rounded">
                  {t('common.soon')}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal">
              <EmailSignaturesList />
            </TabsContent>
            
            <TabsContent value="team">
              <div className="p-8 text-center border rounded-md">
                <h3 className="text-xl font-medium mb-2">
                  {t('emailSignatures.teamFeatureSoon')}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t('emailSignatures.teamFeatureDescription')}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}