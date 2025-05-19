import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import EmailSignaturesList from '@/components/email/EmailSignaturesList';
import { Button } from '@/components/ui/button';

export default function EmailSignaturesPage() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('emailSignatures.pageTitle')} | Experviser CRM</title>
        <meta name="description" content={t('emailSignatures.pageDescription')} />
      </Helmet>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Link href="/emails">
            <Button variant="ghost" className="mb-4 -ml-3">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <EditIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">{t('emailSignatures.title')}</h1>
            </div>
          </div>
          
          <p className="text-muted-foreground mt-2">
            {t('emailSignatures.description')}
          </p>
        </div>
        
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="personal">
              {t('emailSignatures.personalTab')}
            </TabsTrigger>
            <TabsTrigger value="team">
              {t('emailSignatures.teamTab')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <EmailSignaturesList />
          </TabsContent>
          
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>{t('emailSignatures.teamFeatureSoon')}</CardTitle>
                <CardDescription>
                  {t('emailSignatures.teamFeatureDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Button disabled>{t('common.soon')}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}